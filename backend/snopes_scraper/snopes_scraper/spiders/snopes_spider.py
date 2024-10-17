import scrapy
from scrapy import Request
from urllib.parse import urljoin
import json
from ..items import SnopesFactCheckItem

class SnopesSpider(scrapy.Spider):
    name = "snopes_fact_checks"
    allowed_domains = ["snopes.com"]
    start_urls = ["https://www.snopes.com/fact-check/"]

    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' \
                      'AppleWebKit/537.36 (KHTML, like Gecko) ' \
                      'Chrome/90.0.4430.93 Safari/537.36',
        'DOWNLOAD_DELAY': 1,  # Respectful delay between requests
        'FEEDS': {
            'snopes_fact_checks.json': {
                'format': 'json',
                'encoding': 'utf8',
                'store_empty': False,
                'fields': ['Title', 'Author', 'Date', 'Summary', 'URL', 'Image', 'PostDate', 'Rating', 'Tags'],
                'indent': 4,
            },
            'snopes_fact_checks.csv': {
                'format': 'csv',
                'encoding': 'utf8',
                'store_empty': False,
                'fields': ['Title', 'Author', 'Date', 'Summary', 'URL', 'Image', 'PostDate', 'Rating', 'Tags'],
            },
        },
        'LOG_LEVEL': 'INFO',  # To minimize log output, adjust as needed
        'AUTOTHROTTLE_ENABLED': True,
        'AUTOTHROTTLE_START_DELAY': 1,
        'AUTOTHROTTLE_MAX_DELAY': 3,
        'ROBOTSTXT_OBEY': True,  # Respect robots.txt
    }

    def parse(self, response):
        # Extract article links from the current page
        articles = response.css('div.article_wrapper')
        self.logger.info(f"Found {len(articles)} articles on {response.url}")

        for article in articles:
            relative_url = article.css('a.outer_article_link_wrapper::attr(href)').get()
            if relative_url:
                article_url = urljoin(response.url, relative_url)
                yield Request(url=article_url, callback=self.parse_article)

        # Handle pagination by following the "Next" button
        next_page_relative = response.css('a.page-number.next::attr(href)').get()
        if next_page_relative:
            next_page_url = urljoin(response.url, next_page_relative)
            self.logger.info(f"Following next page: {next_page_url}")
            yield Request(url=next_page_url, callback=self.parse)
        else:
            self.logger.info("No more pages to scrape. Spider is terminating.")

    def parse_article(self, response):
        item = SnopesFactCheckItem()
        item['URL'] = response.url

        # Initialize default values
        item['Title'] = "N/A"
        item['Author'] = "N/A"
        item['Date'] = "N/A"
        item['Summary'] = "N/A"
        item['Image'] = "N/A"
        item['PostDate'] = "N/A"
        item['Rating'] = "N/A"
        item['Tags'] = []

        # Extract JSON-LD structured data
        json_ld_scripts = response.xpath('//script[@type="application/ld+json"]/text()').getall()
        for script in json_ld_scripts:
            try:
                json_data = json.loads(script)
                if isinstance(json_data, list):
                    json_data = json_data[0]
                if json_data.get('@type') == 'Article':
                    item['Title'] = json_data.get('headline', 'N/A')
                    author_info = json_data.get('author', {})
                    if isinstance(author_info, dict):
                        item['Author'] = author_info.get('name', 'N/A')
                    item['Date'] = json_data.get('datePublished', 'N/A')
                    item['Summary'] = json_data.get('description', 'N/A')
                    break
            except json.JSONDecodeError:
                continue

        # Fallback methods
        if item['Title'] == "N/A":
            title = response.css('title::text').get()
            if title:
                item['Title'] = title.replace('| Snopes.com', '').strip()

        if item['Summary'] == "N/A":
            meta_desc = response.css('meta[name="description"]::attr(content)').get()
            if meta_desc:
                item['Summary'] = meta_desc.strip()

        if item['Author'] == "N/A":
            author_section = response.css('section.author-container')
            if author_section:
                author = author_section.css('a.author_link::text').get()
                if author:
                    item['Author'] = author.strip()

        if item['Summary'] == "N/A":
            first_paragraph = response.css('article p::text').get()
            if first_paragraph:
                item['Summary'] = first_paragraph.strip()

        # Extract main image
        main_image = response.css('img#cover-main::attr(src)').get()
        if main_image:
            item['Image'] = main_image

        # Extract post date
        post_date = response.css(
            '#article_main > section > section > div > section:nth-of-type(1) > div > div > div:nth-of-type(2) > h3::text'
        ).get()
        if post_date:
            item['PostDate'] = post_date.strip()

        # Extract rating
        rating_element = response.css(
            'html body main section section div div:nth-of-type(2) div:nth-of-type(1) article section div:nth-of-type(2) a div:nth-of-type(2)::text'
        ).get()
        if rating_element:
            item['Rating'] = rating_element.strip()

        # Extract tags
        tag_section = response.css('div#tag_section')
        if tag_section:
            tags = tag_section.css('a.tag_button::text').getall()
            item['Tags'] = [tag.strip() for tag in tags]

        yield item
