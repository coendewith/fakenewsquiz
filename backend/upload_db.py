import os
import csv
from supabase import create_client, Client
import pandas as pd
import numpy as np
import json


# Supabase project credentials
url: str = "https://edemxwuyqwklpqzpmjvj.supabase.co"
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZW14d3V5cXdrbHBxenBtanZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkxMTQ4NTMsImV4cCI6MjA0NDY5MDg1M30.U5B75V21-wyc_VkprJ0Cb_1eVPaogtsJyE6kVkeoJwY"





supabase: Client = create_client(url, key)

# Path to your CSV files
input_csv_path = "/Users/coendewith/Documents/Projects/factchecks/backend/snopes_fact_checks_with_difficulty_score.csv"
output_csv_path = "/Users/coendewith/Documents/Projects/factchecks/backend/snopes_fact_checks_cleaned.csv"

def clean_data(df):
    # Replace NaN values with None
    df = df.replace({np.nan: None})
    
    # Convert date columns to string to avoid datetime serialization issues
    date_columns = ['Date', 'PostDate']
    for col in date_columns:
        if col in df.columns:
            df[col] = df[col].astype(str)
    
    # Empty the ArticleContent and Difficulty_Score columns
    df['ArticleContent'] = None
    df['Difficulty_Score'] = None
    
    return df

def save_cleaned_csv():
    df = pd.read_csv(input_csv_path)
    df = clean_data(df)
    df.to_csv(output_csv_path, index=False)
    print(f"Cleaned CSV saved to: {output_csv_path}")

def upload_csv_data(batch_size=100):
    df = pd.read_csv(output_csv_path)
    total_rows = len(df)
    total_uploaded = 0

    for i in range(0, total_rows, batch_size):
        batch = df.iloc[i:i+batch_size].to_dict(orient='records')
        
        try:
            response = supabase.table("questions").upsert(batch, on_conflict="Title").execute()
            
            if hasattr(response, 'error') and response.error:
                print(f"Error uploading batch: {response.error}")
                print(f"Sample of problematic batch: {json.dumps(batch[:5], indent=2)}")
            else:
                total_uploaded += len(batch)
                print(f"Uploaded {len(batch)} records. Total uploaded: {total_uploaded}")
        except Exception as e:
            print(f"Error uploading batch: {str(e)}")
            print(f"Sample of problematic batch: {json.dumps(batch[:5], indent=2)}")

    print(f"Finished uploading. Total records uploaded: {total_uploaded}")

if __name__ == "__main__":
    print("Cleaning and saving CSV data...")
    save_cleaned_csv()
    
    print("\nUploading cleaned CSV data...")
    upload_csv_data()

    print("Process completed.")
