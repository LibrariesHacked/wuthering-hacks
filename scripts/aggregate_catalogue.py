## This script takes the two CSV files, titles.csv and items.csv
## and aggregates them into a single file of counts of items.
## Two lookup files to provide library names and item categories are also
## created.
## Requires Python v3 and pandas (pip install pandas)
import csv
import os
import re
from datetime import datetime
import pandas

TITLEDATA = '..\\data\\Cataloguetitles-20190806.csv'
ITEMDATA = '..\\data\\Catalogueitems-20190806.csv'

def read_catalogue_data():
    """Return a catalogue titles data object"""
    cat = {
        'records': {}, 'pub_years': {}, 'authors': {},
        'editions': {}, 'classifications': {}, 'publishers': {}
        }
    path = os.path.join(os.path.dirname(__file__), TITLEDATA)
    catreader = csv.DictReader(open(path, 'r', encoding='utf-8'), delimiter=',', quotechar='"', lineterminator='\n')
    # Loop through the CSV
    for row in catreader:

        # first read all the rows
        record_number = row['biblionumber']
        isbn = row['isbn']
        published_year = row['copyrightdate']
        author = row['author']
        title = row['title']
        price = row['price']
        edition = row['editionstatement']
        classification = row['itemcallnumber']
        publisher = row['publishercode']
        acpy = row['Copies']

        if published_year == '':
            published_year = 0
        if published_year not in cat['pub_years']:
            cat['pub_years'][published_year] = 1
        else:
            cat['pub_years'][published_year] = cat['pub_years'][published_year] + 1
        
        if price != '':
            price = round(float(re.sub(r'[^\d.]+', '', price)), 2)
        else:
            price = 0

        if author == '':
            author = 'Unknown'
        if author not in cat['authors']:
            cat['authors'][author] = 1
        else:
            cat['authors'][author] = cat['authors'][author] + 1

        if edition == '':
            edition = 'Unknown'
        if edition not in cat['editions']:
            cat['editions'][edition] = 1
        else:
            cat['editions'][edition] = cat['editions'][edition] + 1
        
        if classification == '':
            classification = 'Unknown'
        if classification not in cat['classifications']:
            cat['classifications'][classification] = 1
        else:
            cat['classifications'][classification] = cat['classifications'][classification] + 1

        if publisher == '':
            publisher = 'Unknown'
        if publisher not in cat['publishers']:
            cat['publishers'][publisher] = 1
        else:
            cat['publishers'][publisher] = cat['publishers'][publisher] + 1

        if acpy == '':
            acpy = 'Unknown'

        cat['records'][record_number] = {
            'isbn': isbn, 'published_year': published_year, 'author': author, 'title': title,
            'price': price, 'edition': edition,
            'classification': classification, 'publisher': publisher,
            'acpy': acpy
            }

    return cat

def construct_references(ref):
    """Return a title reference object"""
    reference = {}

    # Loop through each object in the catalogue records
    for key, value in ref.items():
        if key != 'records':
            sorteditems = [
                (k, ref[key][k]) for k in
                sorted(ref[key], key=ref[key].get, reverse=True)
            ]
            reference[key] = ['Other']
            for i, val in enumerate(sorteditems):
                reference[key].append(val[0])
                if i == 9:
                    break
    return reference

def read_item_data():
    """Return item data object"""

    itemreader = csv.DictReader(
        open(os.path.join(os.path.dirname(__file__), ITEMDATA), 'r'),
        delimiter=',', quotechar='"', lineterminator='\n')

    items = {'records': [], 'branches': {}, 'categories': {}, 'days_added': {}, 'months_added': {}, 'years_added': {}}

    for row in itemreader:
        if row['biblionumber'] != '':

            key = row['barcode']
            rcn = row['biblionumber']
            category = row['itemtype']
            branch = row['homebranch']
            raw_date_added = row['dateaccessioned']
            issues = 0
            if row['issues'] != '':
                issues = int(row['issues'])
            renewals = 0
            if row['renewals'] != '':
                renewals = int(row['renewals'])

            if branch not in items['branches']:
                items['branches'][branch] = 0
            items['branches'][branch] = items['branches'][branch] + 1
            
            if category not in items['categories']:
                items['categories'][category] = 0
            items['categories'][category] = items['categories'][category] + 1
            
            date_added = ''
            month_added = ''
            day_added = ''
            year_added = ''
            if len(raw_date_added) > 10:
                date_added = datetime.strptime(raw_date_added, '%d/%m/%Y %H:%S').strftime('%Y%m%d')
                month_added = datetime.strptime(raw_date_added, '%d/%m/%Y %H:%S').strftime('%Y%m')
                year_added = datetime.strptime(raw_date_added, '%d/%m/%Y %H:%S').strftime('%Y')
                day_added = datetime.strptime(raw_date_added, '%d/%m/%Y %H:%S').strftime('%w')
            elif len(raw_date_added) != 0:
                date_added = datetime.strptime(raw_date_added, '%d/%m/%Y').strftime('%Y%m%d')
                month_added = datetime.strptime(raw_date_added, '%d/%m/%Y').strftime('%Y%m')
                year_added = datetime.strptime(raw_date_added, '%d/%m/%Y').strftime('%Y')
                day_added = datetime.strptime(raw_date_added, '%d/%m/%Y').strftime('%w')
            if day_added not in items['days_added']:
                items['days_added'][day_added] = 0
            items['days_added'][day_added] = items['days_added'][day_added] + 1
            if month_added not in items['months_added']:
                items['months_added'][month_added] = 0
            items['months_added'][month_added] = items['months_added'][month_added] + 1
            if year_added not in items['years_added']:
                items['years_added'][year_added] = 0
            items['years_added'][year_added] = items['years_added'][year_added] + 1

            items['records'].append(
                {
                    'key': key, 'rcn': rcn, 'branch': branch, 'category': category,
                    'date_added': date_added, 'day_added': day_added, 'month_added': month_added,
                    'year_added': year_added, 'issues': issues,
                    'renewals': renewals})

    return items

def run():
    """Main method for aggregate Newcastle catalogue data"""

    cat_records = read_catalogue_data()
    item_records = read_item_data()
    cat_references = construct_references(cat_records)
    item_references = construct_references(item_records)

    final_records = []
    for i in item_records['records']:
        if i['rcn'] in cat_records['records']:
            cat = cat_records['records'][i['rcn']]
            record = {
                'key': i['key'], 'rcn': i['rcn'], 'branch': i['branch'], 'branch_id': 0,
                'category': i['category'], 'category_id': 0, 'date_added': i['date_added'],
                'day_added': i['day_added'], 'month_added': i['month_added'],
                'year_added': i['year_added'], 'issues': i['issues'], 'renewals': i['renewals'],
                'isbn': cat['isbn'], 'published_year': cat['published_year'],
                'author': cat['author'], 'author_id': 0, 'title': cat['title'],
                'price':cat['price'],
                'edition': cat['edition'], 'edition_id': 0, 'classification': cat['classification'],
                'classification_id': 0, 'publisher': cat['publisher'], 'publisher_id': 0, 'count': 1
                }
            if i['branch'] in item_references['branches']:
                record['branch_id'] = item_references['branches'].index(i['branch'])
            if i['category'] in item_references['categories']:
                record['category_id'] = item_references['categories'].index(i['category'])
            if cat['author'] in cat_references['authors']:
                record['author_id'] = cat_references['authors'].index(cat['author'])
            if cat['edition'] in cat_references['editions']:
                record['edition_id'] = cat_references['editions'].index(cat['edition'])
            if cat['classification'] in cat_references['classifications']:
                record['classification_id'] = cat_references['classifications'].index(cat['classification'])
            if cat['publisher'] in cat_references['publishers']:
                record['publisher_id'] = cat_references['publishers'].index(cat['publisher'])
            final_records.append(record)

    itemdata = pandas.DataFrame(final_records, index=None)
    branchesdata = pandas.DataFrame(item_references['branches'], index=None, columns=['branch'])
    branchesdata.index.name = 'id'
    categorydata = pandas.DataFrame(item_references['categories'], index=None, columns=['category'])
    categorydata.index.name = 'id'
    authorsdata = pandas.DataFrame(cat_references['authors'], index=None, columns=['author'])
    authorsdata.index.name = 'id'
    editionsdata = pandas.DataFrame(cat_references['editions'], index=None, columns=['edition'])
    editionsdata.index.name = 'id'
    classificationsdata = pandas.DataFrame(cat_references['classifications'], index=None, columns=['classification'])
    classificationsdata.index.name = 'id'
    publishersdata = pandas.DataFrame(cat_references['publishers'], index=None, columns=['publisher'])
    publishersdata.index.name = 'id'
    groupeditems = itemdata.groupby(['branch_id', 'category_id', 'year_added', 'day_added', 'published_year', 'edition_id', 'classification_id', 'publisher_id']).agg({'count': 'sum', 'price': 'sum', 'issues': 'sum', 'renewals': 'sum'})
    groupeditems.price = groupeditems.price.round(2)

    itemdata.to_csv(
        os.path.join(os.path.dirname(__file__), '..\\data\\dashboard_items_titles_merged.csv'),
        index=False, columns=[
            'key', 'rcn', 'published_year', 'author', 'title',
            'classification', 'isbn', 'edition',
            'price', 'branch', 'date_added', 'issues', 'renewals']
        )
    itemdata.to_csv(
        os.path.join(os.path.dirname(__file__), '..\\data\\dashboard_catalogue.csv'),
        index=False, columns=[
            'rcn', 'item', 'category', 'date_added', 'issues', 'renewals', 'price']
        )
    groupeditems.to_csv(
        os.path.join(os.path.dirname(__file__), '..\\data\\dashboard_catalogue_grouped.csv')
        )
    branchesdata.to_csv(
        os.path.join(os.path.dirname(__file__), '..\\data\\dashboard_catalogue_branches.csv')
        )
    categorydata.to_csv(
        os.path.join(os.path.dirname(__file__), '..\\data\\dashboard_catalogue_categories.csv')
        )
    authorsdata.to_csv(
        os.path.join(os.path.dirname(__file__), '..\\data\\dashboard_catalogue_authors.csv')
        )
    editionsdata.to_csv(
        os.path.join(os.path.dirname(__file__), '..\\data\\dashboard_catalogue_editions.csv')
        )
    classificationsdata.to_csv(
        os.path.join(os.path.dirname(__file__), '..\\data\\dashboard_catalogue_classifications.csv')
        )
    publishersdata.to_csv(
        os.path.join(os.path.dirname(__file__), '..\\data\\dashboard_catalogue_publishers.csv')
        )

run()