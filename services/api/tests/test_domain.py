import unittest
from decimal import Decimal
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from app.domain import normalize, stage_total, filtered_records, get_stage

class DomainTests(unittest.TestCase):
    def test_accents(self):
        self.assertEqual(normalize('Juazeiro do Norte'),normalize('JUAZEIRO DO NORTE'))
        self.assertEqual(normalize('Crateús'),normalize('crateus'))
    def test_not_sum_different_financial_stages(self):
        rows=[{'paid':'50.00','committed':'70.00'},{'paid':'5.40','committed':'90.00'}]
        self.assertEqual(stage_total(rows,'paid'),Decimal('55.40'))
        self.assertEqual(stage_total(rows,'committed'),Decimal('160.00'))
    def test_missing_not_zero(self):
        with self.assertRaises(ValueError):get_stage({},'paid')
    def test_search(self):
        self.assertEqual(len(filtered_records([{'municipality':'Crateús'}], 'crateus')),1)

if __name__=='__main__':unittest.main()
