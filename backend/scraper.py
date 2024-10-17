import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
from urllib.parse import urljoin
import json
from transformers import pipeline
import torch

# Constants
BASE_URL = "https://www.snopes.com/fact-check/"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " \
                  "AppleWebKit/537.36 (KHTML, like Gecko) " \
                  "Chrome/90.0.4430.93 Safari/537.36"
}

class DifficultyCategorizer:
    def __init__(self, model_name="facebook/bart-large-mnli", device=-1):
        """
        Initializes the zero-shot classification pipeline.

        Args:
            model_name (str): Hugging Face model name for zero-shot classification.
            device (int): Device to run the model on (-1 for CPU, >=0 for GPU).
        """
        self.classifier = pipeline("zero-shot-classification", model=model_name, device=device)

    def categorize(self, text, candidate_labels):
        """
        Categorizes the input text into one of the candidate labels.

        Args:
            text (str): The text to classify.
            candidate_labels (list): List of labels to classify the text into.

        Returns:
            str: The label with the highest confidence score.
        """
        result = self.classifier(text, candidate_labels)
        return result['labels'][0]

# Initialize DataFrame
df = pd.DataFrame(columns=['Title', 'Author', 'Date', 'Summary', 'URL', 'Image', 'PostDate', 'Rating', 'Tags', 'Claim', 'Context', 'ArticleContent'])

total_pages = 300
print(f"Total pages to scrape: {total_pages}")

# Scrape all pages
all_links = set()  # Use a set to automatically remove duplicates
for page_num in range(1, total_pages + 1):
    page_url = f"{BASE_URL}?pagenum={page_num}"
    print(f"Scraping page {page_num}: {page_url}")
    response = requests.get(page_url, headers=HEADERS)
    
    response.raise_for_status()

    soup = BeautifulSoup(response.text, 'html.parser')
    articles = soup.find_all('div', class_='article_wrapper')
    for article in articles:
        a_tag = article.find('a', class_='outer_article_link_wrapper')
        if a_tag and a_tag.get('href'):
            link = urljoin(BASE_URL, a_tag['href'])
            all_links.add(link)
    print(f"Found {len(articles)} articles on page {page_num}.")
    
    time.sleep(1)  # Respectful delay between page requests

# Convert set back to list for further processing
all_links = list(all_links)

# Calculate and print the number of duplicate articles removed
total_articles_found = sum(len(soup.find_all('div', class_='article_wrapper')) for _ in range(total_pages))
duplicates_removed = total_articles_found - len(all_links)

print(f"Number of duplicate articles removed: {duplicates_removed}")
print(f"Total unique articles found: {len(all_links)}")

# Process each article
all_data = []
for idx, url in enumerate(all_links, start=1):
    print(f"Processing article {idx}/{len(all_links)}")
    try:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        data = {"Title": "N/A", "Author": "N/A", "Date": "N/A", "Summary": "N/A", "URL": url, "Image": "N/A", "PostDate": "N/A", "Rating": "N/A", "Tags": [], "Claim": "N/A", "Context": "N/A", "ArticleContent": "N/A"}
        
        # Extract JSON-LD structured data
        json_ld_scripts = soup.find_all('script', type='application/ld+json')
        for script in json_ld_scripts:
            try:
                json_data = json.loads(script.string, strict=False)
                if isinstance(json_data, list):
                    json_data = json_data[0]
                if json_data.get('@type') == 'Article':
                    data['Title'] = json_data.get('headline', 'N/A')
                    author_info = json_data.get('author', {})
                    if isinstance(author_info, dict):
                        data['Author'] = author_info.get('name', 'N/A')
                    data['Date'] = json_data.get('datePublished', 'N/A')
                    data['Summary'] = json_data.get('description', 'N/A')
                    break
            except (json.JSONDecodeError, TypeError):
                continue
        
        # Fallback methods
        if data['Title'] == "N/A":
            title_tag = soup.find('title')
            if title_tag:
                data['Title'] = title_tag.text.replace('| Snopes.com', '').strip()
        
        if data['Summary'] == "N/A":
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            if meta_desc and meta_desc.get('content'):
                data['Summary'] = meta_desc['content'].strip()
        
        if data['Author'] == "N/A":
            author_section = soup.find('section', class_='author-container')
            if author_section:
                author_link = author_section.find('a', class_='author_link')
                if author_link:
                    data['Author'] = author_link.text.strip()
        
        if data['Summary'] == "N/A":
            article_body = soup.find('article')
            if article_body:
                first_paragraph = article_body.find('p')
                if first_paragraph:
                    data['Summary'] = first_paragraph.text.strip()
        
        # Extract main image
        main_image = soup.find('img', id='cover-main')
        if main_image and main_image.get('src'):
            data['Image'] = main_image['src']
        
        # Extract post date
        post_date = soup.select_one('#article_main > section > section > div > section:nth-of-type(1) > div > div > div:nth-of-type(2) > h3')
        if post_date:
            data['PostDate'] = post_date.text.strip()
        
        # Extract rating
        rating_element = soup.select_one('html body main section section div div:nth-of-type(2) div:nth-of-type(1) article section div:nth-of-type(2) a div:nth-of-type(2)')
        if rating_element:
            data['Rating'] = rating_element.text.strip()
        
        # Extract tags
        tag_section = soup.find('div', id='tag_section')
        if tag_section:
            tag_buttons = tag_section.find_all('a', class_='tag_button')
            data['Tags'] = [tag.text.strip() for tag in tag_buttons]
        
        # Extract claim
        claim_wrapper = soup.find('div', class_='claim_wrapper')
        if claim_wrapper:
            claim_cont = claim_wrapper.find('div', class_='claim_cont')
            if claim_cont:
                data['Claim'] = claim_cont.text.strip()
        
        # Extract context
        context_element = soup.find('div', class_='outer_fact_check_context')
        if context_element:
            context_parts = []
            for info_wrapper in context_element.find_all('div', class_='fact_check_info_wrapper'):
                title = info_wrapper.find('span', class_='fact_check_info_title')
                description = info_wrapper.find('p', class_='fact_check_info_description')
                if title and description:
                    context_parts.append(f"{title.text.strip()}: {description.text.strip()}")
            data['Context'] = ' '.join(context_parts)
        
        # Extract article content
        article_content = soup.find('article', id='article-content')
        if article_content:
            data['ArticleContent'] = str(article_content)
        
        df = pd.concat([df, pd.DataFrame([data])], ignore_index=True)
        all_data.append(data)
        
        # Append the data to JSON file after each successful extraction
        with open('snopes_fact_checks.json', 'w', encoding='utf-8') as f:
            json.dump(all_data, f, ensure_ascii=False, indent=4)
        
    except requests.exceptions.RequestException as e:
        print(f"Error fetching article {idx}: {e}")
    
    time.sleep(0.5)  # Respectful delay between requests

# Save to CSV
df.to_csv('snopes_fact_checks.csv', index=False)
print("Data saved to snopes_fact_checks.csv")

print("Data saved to snopes_fact_checks.json")

# Initialize the DifficultyCategorizer
categorizer = DifficultyCategorizer(model_name="facebook/bart-large-mnli", device=-1)

# Define candidate labels
candidate_labels = ["Easy", "Hard to Know"]

# Apply categorization to the 'Summary' column
print("Categorizing difficulty levels. This may take a while...")
df['Difficulty'] = df['Summary'].apply(lambda x: categorizer.categorize(x, candidate_labels))

# Display the first few rows to verify
print(df[['Title', 'Summary', 'Difficulty']].head())

# Save the updated DataFrame to a new CSV file
df.to_csv('snopes_fact_checks_with_difficulty.csv', index=False)
print("Categorization complete. Saved to 'snopes_fact_checks_with_difficulty.csv'.")

# Save the updated data to JSON
with open('snopes_fact_checks_with_difficulty.json', 'w', encoding='utf-8') as f:
    json.dump(df.to_dict('records'), f, ensure_ascii=False, indent=4)
print("Data saved to snopes_fact_checks_with_difficulty.json")