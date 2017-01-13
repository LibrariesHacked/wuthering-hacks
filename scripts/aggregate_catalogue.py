import csv
import os
import pandas
import re
import numpy as np
from datetime import datetime
cat_records = {}
catreader = csv.DictReader(open(os.path.join(os.path.dirname(__file__), '..\\data\\newcastle_catalogue.csv'), 'r'), delimiter=',', quotechar='"', lineterminator='\n')
for row in catreader:
    cat_records[row['rcn']] = { 'price': round(float(re.sub(r'[^\d.]+', '', row['price'])), 2) }

branches = []
categories = []
item_records = []
itemreader = csv.DictReader(open(os.path.join(os.path.dirname(__file__), '..\\data\\newcastle_items.csv'), 'r'), delimiter=',', quotechar='"', lineterminator='\n')
for row in itemreader:
    if (row['rcn'] != '' and row['rcn'] in cat_records):
        if (row['name'] not in branches):
            branches.append(row['name'])
        if (row['text'] not in categories):
            categories.append(row['text'])
        item_records.append({ 'item': row['item'], 'rcn': row['rcn'], 'categoryId': categories.index(row['text']), 'branchId': branches.index(row['name']), 'added': row['added'], 'issues': int(row['issues current branch']) + int(row['issues previous branch']), 'renewals': int(row['renewals current branch']) + int(row['renewals previous branch']), 'price': cat_records.get(row['rcn']).get('price') })

itemdata = pandas.DataFrame(item_records, index=None)
branchesdata = pandas.DataFrame(branches, index=None, columns=['branch'])
branchesdata.index.name = 'id'
categorydata = pandas.DataFrame(categories, index=None, columns=['category'])
categorydata.index.name = 'id'
groupeditems = itemdata.groupby(['categoryId', 'branchId']).agg({ 'price': 'sum', 'issues': 'sum', 'renewals': 'sum' })
groupeditems.price = groupeditems.price.round(2)

itemdata.to_csv(os.path.join(os.path.dirname(__file__), '..\\data\\dashboard_items.csv'), index=False)
groupeditems.to_csv(os.path.join(os.path.dirname(__file__), '..\\data\\dashboard_itemsgrouped.csv'))
branchesdata.to_csv(os.path.join(os.path.dirname(__file__), '..\\data\\dashboard_itembranches.csv'))
categorydata.to_csv(os.path.join(os.path.dirname(__file__), '..\\data\\dashboard_itemcategories.csv'))