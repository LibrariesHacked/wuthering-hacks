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
    publishersobj = {}

    catreader = csv.DictReader(open(os.path.join(os.path.dirname(__file__), '..\\data\\titles.csv'), 'r'), delimiter=',', quotechar='"', lineterminator='\n')
    for row in catreader:
        if row['publisher'] == '':
            row['publisher'] = 'Unknown'
        cat_records[row['rcn']] = { 'price': round(float(re.sub(r'[^\d.]+', '', row['price'])), 2), 'publisher': row['publisher'] }
        if row['publisher'] not in publishersobj:
            publishersobj[row['publisher']] = 1
        else:
            publishersobj[row['publisher']] = publishersobj[row['publisher']] + 1

    publishers = ['Other']
    s = [(k, publishersobj[k]) for k in sorted(publishersobj, key=publishersobj.get, reverse=True)]
    for i, p in enumerate(s):
        publishers.append(p[0])
        if i == 15:
            break
    branches = []
    dates = []
    months = []
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
                dateadded = ''
                monthadded = ''
                dayadded = ''
            elif len(row['added']) > 10:
                dateadded = datetime.strptime(row['added'], '%d/%m/%Y %H:%S').strftime('%Y%m%d')
                monthadded = datetime.strptime(row['added'], '%d/%m/%Y %H:%S').strftime('%Y%m')
                dayadded = datetime.strptime(row['added'], '%d/%m/%Y %H:%S').strftime('%w')
            else:
                dateadded = datetime.strptime(row['added'], '%d/%m/%Y').strftime('%Y%m%d')
                monthadded = datetime.strptime(row['added'], '%d/%m/%Y').strftime('%Y%m')
                dayadded = datetime.strptime(row['added'], '%d/%m/%Y').strftime('%w')
            if dateadded not in dates:
                dates.append(dateadded)
            if monthadded not in months:
                months.append(monthadded)
            publisher = cat_records.get(row['rcn']).get('publisher')
            if publisher in publishers:
                publishId = publishers.index(publisher)
            else:
                publishId = publishers.index('Other')
            item_records.append({ 'item': row['item'], 'rcn': row['rcn'], 'categoryId': categories.index(row['text']), 'branchId': branches.index(row['name']), 'publisherId': publishId, 'dayAdded': dayadded, 'dateAddedId': dates.index(dateadded), 'monthAddedId': months.index(monthadded), 'added': row['added'], 'issues': int(row['issues current branch']) + int(row['issues previous branch']), 'renewals': int(row['renewals current branch']) + int(row['renewals previous branch']), 'price': cat_records.get(row['rcn']).get('price'), 'count': 1 })

    itemdata = pandas.DataFrame(item_records, index=None)
    publishersdata = pandas.DataFrame(publishers, index=None, columns=['publisher'])
    publishersdata.index.name = 'id'
    branchesdata = pandas.DataFrame(branches, index=None, columns=['branch'])
    branchesdata.index.name = 'id'
    datesdata = pandas.DataFrame(dates, index=None, columns=['date'])
    datesdata.index.name = 'id'
    monthsdata = pandas.DataFrame(months, index=None, columns=['month'])
    monthsdata.index.name = 'id'
    categorydata = pandas.DataFrame(categories, index=None, columns=['category'])
    categorydata.index.name = 'id'
    groupeditems = itemdata.groupby(['categoryId', 'publisherId', 'branchId', 'dayAdded', 'monthAddedId']).agg({ 'count': 'sum', 'price': 'sum', 'issues': 'sum', 'renewals': 'sum' })
    groupeditems.price = groupeditems.price.round(2)

    itemdata.to_csv(os.path.join(os.path.dirname(__file__), '..\\data\\dashboard_catalogue.csv'), index=False, columns=['rcn','item','categoryId','branchId','added','issues','renewals','price'])
    groupeditems.to_csv(os.path.join(os.path.dirname(__file__), '..\\data\\dashboard_catalogue_grouped.csv'))
    publishersdata.to_csv(os.path.join(os.path.dirname(__file__), '..\\data\\dashboard_catalogue_publishers.csv'))
    branchesdata.to_csv(os.path.join(os.path.dirname(__file__), '..\\data\\dashboard_catalogue_branches.csv'))
    categorydata.to_csv(os.path.join(os.path.dirname(__file__), '..\\data\\dashboard_catalogue_categories.csv'))
    datesdata.to_csv(os.path.join(os.path.dirname(__file__), '..\\data\\dashboard_catalogue_dates.csv'))
    monthsdata.to_csv(os.path.join(os.path.dirname(__file__), '..\\data\\dashboard_catalogue_months.csv'))

run()