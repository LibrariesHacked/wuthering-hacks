## Requires Python v3
## This script takes the usage CSV files,and combines them to produce a single monthly usage file

import csv
import os
import pandas

ENQUIRIES = '..\\data\\2008-onwards-monthly-enquiries.csv'
ISSUES = '..\\data\\2008-onwards-monthly-issues-by-branch.csv'
VISITS = '..\\data\\2008-onwards-monthly-visits.csv'
SESSIONS = '..\\data\\2008-onwards-monthly-computer-use.csv'
OUTPUT = '..\\data\\dashboard_usage.csv'

def run():

	edf = pandas.DataFrame(pandas.read_csv(open(os.path.join(os.path.dirname(__file__), ENQUIRIES), 'r')), index=None)
	enquiries = pandas.melt(edf, id_vars=['Library'], var_name='month', value_name='enquiries')
	
	idf = pandas.DataFrame(pandas.read_csv(open(os.path.join(os.path.dirname(__file__), ISSUES), 'r')), index=None)
	issues = pandas.melt(idf, id_vars=['Library'], var_name='month', value_name='issues')
	
	vdf = pandas.DataFrame(pandas.read_csv(open(os.path.join(os.path.dirname(__file__), VISITS), 'r')), index=None)
	visits = pandas.melt(vdf, id_vars=['Library'], var_name='month', value_name='visits')

	pcdf = pandas.DataFrame(pandas.read_csv(open(os.path.join(os.path.dirname(__file__), SESSIONS), 'r')), index=None)
	computers = pandas.melt(pcdf, id_vars=['Library'], var_name='month', value_name='sessions')

	usage = enquiries.merge(visits).merge(issues).merge(computers)
	usage.to_csv(os.path.join(os.path.dirname(__file__), OUTPUT), index=False, float_format='%.0f')

run()