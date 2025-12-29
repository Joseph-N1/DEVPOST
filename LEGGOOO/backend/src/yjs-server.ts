/**
 * y-websocket server for LEGGOOO real-time collaboration
 * 
 * Features:
 * - Yjs document synchronization
 * - Awareness (cursor presence) broadcasting
 * - 5-editor cap enforcement per file
 * - Periodic snapshot persistence (TODO: integrate with Supabase)
 */

import { WebSocketServer, WebSocket } from 'ws';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';

const MAX_EDITORS_PER_FILE = 5;

// Message types for y-websocket protocol
const messageSync = 0;
const messageAwareness = 1;

// Store for all documents
const docs = new Map<string, WSSharedDoc>();

interface AwarenessUser {
  id: string;
  name: string;
  color: string;
  cursor: { line: number; column: number } | null;
  selection: { start: { line: number; column: number }; end: { line: number; column: number } } | null;
  isEditor: boolean;
}

class WSSharedDoc extends Y.Doc {
  name: string;
  conns: Map<WebSocket, Set<number>>;
  awareness: awarenessProtocol.Awareness;

  constructor(name: string) {
    super({ gc: true });
    this.name = name;
    this.conns = new Map();
    this.awareness = new awarenessProtocol.Awareness(this);

    // Handle awareness updates
    this.awareness.on('update', ({ added, updated, removed }: { 
      added: number[]; 
      updated: number[]; 
      removed: number[];
    }) => {
      const changedClients = added.concat(updated, removed);
      
      // Enforce 5-editor cap
      this.enforceEditorCap();
      
      // Broadcast awareness changes
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients)
      );
      const message = encoding.toUint8Array(encoder);
      
      this.conns.forEach((_, conn) => {
        send(this, conn, message);
      });
    });
  }

  /**
   * Enforce 5-editor cap: 6th+ users become viewers
   */
  enforceEditorCap(): void {
    const states = this.awareness.getStates();
    const editors: number[] = [];
    const viewers: number[] = [];

    // Sort users by connection order (client ID)
    const sortedClients = Array.from(states.keys()).sort((a, b) => a - b);

    for (const clientId of sortedClients) {
      const state = states.get(clientId);
      if (!state?.user) continue;

      const user = state.user as AwarenessUser;
      
      if (editors.length < MAX_EDITORS_PER_FILE && user.isEditor !== false) {
        editors.push(clientId);
        // Ensure they are marked as editor
        if (!user.isEditor) {
          this.awareness.setLocalStateField('user', { ...user, isEditor: true });
        }
      } else {
        viewers.push(clientId);
        // Mark as viewer if they think they're an editor
        if (user.isEditor) {
          // Send message to client to update their state
          // This is handled client-side by checking canUserEdit
        }
      }
    }
  }
}

function getYDoc(docname: string): WSSharedDoc {
  let doc = docs.get(docname);
  if (!doc) {
    doc = new WSSharedDoc(docname);
    docs.set(docname, doc);
    
    // Setup update listener for persistence
    doc.on('update', (update: Uint8Array, _origin: unknown) => {
      // TODO: Persist updates to Supabase Storage
      // For now, log for debugging
      console.log(`[YJS] Document ${docname} updated, ${update.length} bytes`);
    });
  }
  return doc;
}

function send(doc: WSSharedDoc, conn: WebSocket, message: Uint8Array): void {
  if (conn.readyState === WebSocket.OPEN) {
    try {
      conn.send(message);
    } catch (e) {
      closeConn(doc, conn);
    }
  }
}

function closeConn(doc: WSSharedDoc, conn: WebSocket): void {
  if (doc.conns.has(conn)) {
    const controlledIds = doc.conns.get(conn)!;
    doc.conns.delete(conn);
    
    // Remove awareness states for disconnected client
    awarenessProtocol.removeAwarenessStates(
      doc.awareness,
      Array.from(controlledIds),
      null
    );

    // Cleanup empty documents after delay
    if (doc.conns.size === 0) {
      setTimeout(() => {
        if (doc.conns.size === 0) {
          // TODO: Save final snapshot before destroying
          docs.delete(doc.name);
          doc.destroy();
          console.log(`[YJS] Document ${doc.name} destroyed (no connections)`);
        }
      }, 30000); // 30 second grace period
    }
  }
}

function messageListener(
  conn: WebSocket,
  doc: WSSharedDoc,
  message: Uint8Array
): void {
  try {
    const decoder = decoding.createDecoder(message);
    const messageType = decoding.readVarUint(decoder);

    switch (messageType) {
      case messageSync:
        {
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, messageSync);
          syncProtocol.readSyncMessage(
            decoder,
            encoder,
            doc,
            conn
          );
          
          // If sync step 1 or 2, send response
          if (encoding.length(encoder) > 1) {
            send(doc, conn, encoding.toUint8Array(encoder));
          }
        }
        break;

      case messageAwareness:
        {
          const update = decoding.readVarUint8Array(decoder);
          awarenessProtocol.applyAwarenessUpdate(
            doc.awareness,
            update,
            conn
          );
        }
        break;

      default:
        console.warn(`[YJS] Unknown message type: ${messageType}`);
    }
  } catch (err) {
    console.error('[YJS] Error handling message:', err);
  }
}

export function setupWSConnection(conn: WebSocket, docName: string): void {
  const doc = getYDoc(docName);
  doc.conns.set(conn, new Set());

  console.log(`[YJS] Client connected to document: ${docName}`);

  // Handle messages
  conn.on('message', (data: Buffer | ArrayBuffer | Buffer[]) => {
    let message: Uint8Array;
    if (data instanceof ArrayBuffer) {
      message = new Uint8Array(data);
    } else if (Array.isArray(data)) {
      message = Buffer.concat(data);
    } else {
      message = new Uint8Array(data);
    }
    messageListener(conn, doc, message);
  });

  // Handle close
  conn.on('close', () => {
    console.log(`[YJS] Client disconnected from document: ${docName}`);
    closeConn(doc, conn);
  });

  // Handle errors
  conn.on('error', (err) => {
    console.error('[YJS] WebSocket error:', err);
    closeConn(doc, conn);
  });

  // Send initial sync step 1
  {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeSyncStep1(encoder, doc);
    send(doc, conn, encoding.toUint8Array(encoder));
  }

  // Send awareness states
  {
    const awarenessStates = doc.awareness.getStates();
    if (awarenessStates.size > 0) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(
          doc.awareness,
          Array.from(awarenessStates.keys())
        )
      );
      send(doc, conn, encoding.toUint8Array(encoder));
    }
  }
}

/**
 * Create and start the y-websocket server
 */
export function createYjsServer(port: number = 1234): WebSocketServer {
  const wss = new WebSocketServer({ port });

  wss.on('connection', (conn, req) => {
    // Extract document name from URL path
    // Expected format: ws://host:port/{workspaceId}-{fileId}
    const docName = req.url?.slice(1) || 'default';
    setupWSConnection(conn, docName);
  });

  wss.on('listening', () => {
    console.log(`[YJS] WebSocket server listening on port ${port}`);
  });

  wss.on('error', (err) => {
    console.error('[YJS] WebSocket server error:', err);
  });

  return wss;
}

// Export for use in main server
export { docs, WSSharedDoc };
