import scrapy

class SnopesFactCheckItem(scrapy.Item):
    Title = scrapy.Field()
    Author = scrapy.Field()
    Date = scrapy.Field()
    Summary = scrapy.Field()
    URL = scrapy.Field()
    Image = scrapy.Field()
    PostDate = scrapy.Field()
    Rating = scrapy.Field()
    Tags = scrapy.Field()
