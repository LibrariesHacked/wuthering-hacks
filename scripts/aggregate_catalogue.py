## This script takes the two CSV files, titles.csv and items.csv
## and aggregates them into a single file of counts of items.
## Two lookup files to provide library names and item categories are also created.
## Requires Python v3 and pandas (pip install pandas)

import csv
import os
import re
from datetime import datetime
import pandas

def run():

    cat_records = {}

    catreader = csv.DictReader(open(os.path.join(os.path.dirname(__file__), '..\\data\\titles.csv'), 'r'), delimiter=',', quotechar='"', lineterminator='\n')
    for row in catreader:
        cat_records[row['rcn']] = { 'price': round(float(re.sub(r'[^\d.]+', '', row['price'])), 2) }

    branches = []
    categories = []
    item_records = []
    itemreader = csv.DictReader(open(os.path.join(os.path.dirname(__file__), '..\\data\\items.csv'), 'r'), delimiter=',', quotechar='"', lineterminator='\n')
    for row in itemreader:
        if row['rcn'] != '' and row['rcn'] in cat_records:
            if row['name'] not in branches:
                branches.append(row['name'])
            if row['text'] not in categories:
                categories.append(row['text'])
            if len(row['added']) == 0:
                monthAdded = ''
            elif len(row['added']) > 10:
                monthAdded = datetime.strptime(row['added'], '%d/%m/%Y %H:%S').strftime('%m-%Y')
            else:
                monthAdded = datetime.strptime(row['added'], '%d/%m/%Y').strftime('%m-%Y')
            item_records.append({ 'item': row['item'], 'rcn': row['rcn'], 'categoryId': categories.index(row['text']), 'branchId': branches.index(row['name']), 'added': row['added'], 'monthAdded': monthAdded, 'issues': int(row['issues current branch']) + int(row['issues previous branch']), 'renewals': int(row['renewals current branch']) + int(row['renewals previous branch']), 'price': cat_records.get(row['rcn']).get('price'), 'count': 1 })

    itemdata = pandas.DataFrame(item_records, index=None)
    branchesdata = pandas.DataFrame(branches, index=None, columns=['branch'])
    branchesdata.index.name = 'id'
    categorydata = pandas.DataFrame(categories, index=None, columns=['category'])
    categorydata.index.name = 'id'
    groupeditems = itemdata.groupby(['categoryId', 'branchId', 'monthAdded']).agg({ 'count': 'sum', 'price': 'sum', 'issues': 'sum', 'renewals': 'sum' })
    groupeditems.price = groupeditems.price.round(2)

    itemdata.to_csv(os.path.join(os.path.dirname(__file__), '..\\data\\dashboard_catalogue.csv'), index=False, columns=['rcn','item','categoryId','branchId','added','issues','renewals','price'])
    groupeditems.to_csv(os.path.join(os.path.dirname(__file__), '..\\data\\dashboard_catalogue_grouped.csv'))
    branchesdata.to_csv(os.path.join(os.path.dirname(__file__), '..\\data\\dashboard_catalogue_branches.csv'))
    categorydata.to_csv(os.path.join(os.path.dirname(__file__), '..\\data\\dashboard_catalogue_categories.csv'))

run()