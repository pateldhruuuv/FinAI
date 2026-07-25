import os
from test_sc_parser import test_standard_chartered_parser

if __name__ == "__main__":
    print("="*60)
    print("Running Standard Chartered Parser Unit Tests...")
    print("="*60)
    try:
        test_standard_chartered_parser()
        print("\nSUCCESS: All Standard Chartered Parser tests passed!")
    except AssertionError as e:
        print(f"\nFAILURE: Test assertion failed: {e}")
        exit(1)
    except Exception as e:
        print(f"\nERROR: Unexpected error during test run: {e}")
        exit(1)
