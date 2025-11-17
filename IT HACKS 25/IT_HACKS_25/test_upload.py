import requests

# Test CSV upload
file_path = r"C:\Users\Joseph N Nimyel\OneDrive\Documents\DEVPOST\IT HACKS 25\IT_HACKS_25\backend\data\sample_data\sample_upload.csv"

with open(file_path, 'rb') as f:
    files = {'file': ('test_upload.csv', f, 'text/csv')}
    response = requests.post('http://localhost:8000/upload/csv', files=files)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

# Test files list
response = requests.get('http://localhost:8000/upload/files')
print(f"\nFiles list status: {response.status_code}")
files = response.json()
print(f"Found {len(files)} files")
for f in files[:3]:  # Show first 3
    print(f"  - {f['filename']} ({f['type']})")

# Test preview
if files:
    first_file = files[0]
    response = requests.get(f"http://localhost:8000/upload/preview/{first_file['path']}?rows=2")
    print(f"\nPreview status: {response.status_code}")
    if response.status_code == 200:
        preview = response.json()
        print(f"Preview of {preview['filename']}: {preview['total_rows']} rows, {preview['total_columns']} columns")
        print(f"Columns: {', '.join(preview['columns'][:5])}...")
