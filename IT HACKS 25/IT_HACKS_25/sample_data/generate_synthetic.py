
import csv, random, datetime
from pathlib import Path

def generate(num_rooms=3, days=60, start_date='2025-04-01'):
    start = datetime.datetime.fromisoformat(start_date)
    rows = []
    for r in range(1, num_rooms+1):
        bird_count = random.randint(80, 120)
        for d in range(days):
            date = (start + datetime.timedelta(days=d)).date().isoformat()
            age = d + 1
            temp = round(28 + random.gauss(0,1.5),1)
            hum = round(65 + random.gauss(0,4),1)
            ammonia = max(0, round(8 + random.gauss(0,2),1))
            feed = round(10 + age*0.1 + random.gauss(0,1.5),2)
            feed_type = random.choice(['Feed A','Feed B','Feed C','Feed D'])
            vitamins = random.choice(['Vit A','Vit B','Vit C','None'])
            disinfect = random.choice(['Yes','No'])
            mortality = 0
            if random.random() < 0.02:
                mortality = random.randint(1,3)
            egg_count = 0
            avg_weight = round(0.2 + age*0.02 + random.gauss(0,0.05),2)
            rows.append([f'farm_1', f'room_{r}', date, age, temp, hum, ammonia, feed, feed_type, vitamins, disinfect, mortality, egg_count, avg_weight, bird_count])
    return rows

def save(rows, filename='synthetic.csv'):
    Path(filename).parent.mkdir(parents=True, exist_ok=True)
    with open(filename,'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['farm_id','room_id','date','age_days','temperature_c','humidity_pct','ammonia_ppm','feed_consumed_kg','feed_type','vitamins','disinfectant_used','mortality_count','egg_count','avg_weight_kg','bird_count'])
        writer.writerows(rows)

if __name__ == '__main__':
    rows = generate(num_rooms=4, days=90, start_date='2025-01-01')
    save(rows, 'sample_data/synthetic_4rooms_90days.csv')
    print('Synthetic CSV generated at sample_data/synthetic_4rooms_90days.csv')
