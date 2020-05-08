## Requires Python v3
## This script takes the usage CSV files,and combines them to produce a single monthly usage file

import csv
import pandas
from pathlib import Path

data_folder = Path('./data')

ENQUIRIES = '2008-onwards-monthly-enquiries.csv'
ISSUES = '2008-onwards-monthly-issues-by-branch.csv'
VISITS = '2008-onwards-monthly-visits.csv'
SESSIONS = '2008-onwards-monthly-computer-use.csv'
OUTPUT = 'dashboard_usage.csv'

def run():
	
	idf = pandas.read_csv(open(data_folder / ISSUES))
	issues = pandas.melt(idf, id_vars=['Library'], var_name='month', value_name='issues')

	edf = pandas.read_csv(open(data_folder / ENQUIRIES))
	enquiries = pandas.melt(edf, id_vars=['Library'], var_name='month', value_name='enquiries')
	
	vdf = pandas.read_csv(open(data_folder / VISITS))
	visits = pandas.melt(vdf, id_vars=['Library'], var_name='month', value_name='visits')

	pcdf = pandas.read_csv(open(data_folder / SESSIONS))
	computers = pandas.melt(pcdf, id_vars=['Library'], var_name='month', value_name='sessions')

	usage = enquiries.merge(visits).merge(issues).merge(computers)
	usage.to_csv(data_folder / OUTPUT, index=False, float_format='%.0f')

run()