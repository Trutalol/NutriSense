"""Train NutriSense's screening model and export it for the Node app.

Ridge (L2-penalised) logistic regression with the tuned parameters:
    penalty='l2', C=0.018873918221350976, intercept_scaling=10.0, class_weight=None (liblinear solver)
Target: HAS_MALNUTRITION. The file's precomputed risk columns are never given to the model, and race, education,
income and marital status are left out on purpose so the score does not depend on demographics.

Usage:  python train-model.py [path/to/data.csv] [path/to/model.json]
Needs:  pandas, scikit-learn. The CSV must still contain HAS_MALNUTRITION.
"""
import json
import sys
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import RepeatedStratifiedKFold, cross_val_score, StratifiedKFold, cross_val_predict
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

HERE = Path(__file__).resolve().parent
DATA = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE.parent / 'data' / 'csv' / 'data.csv'
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else HERE / 'model.json'

TARGET = 'HAS_MALNUTRITION'
# Never used as inputs: the file's own risk values and the random draw behind the label.
EXCLUDED = ['MALNUTRITION_RISK_SCORE', 'MALNUTRITION_PROBABILITY_SYNTHETIC', 'MALNUTRITION_RANDOM_DRAW', TARGET]
NUMERIC = ['RIDAGEYR', 'BMXWT', 'BMXBMI', 'BMXHT', 'BMXARMC', 'BMXWAIST', 'BMXHIP', 'DR1TKCAL', 'DR1TPROT', 'DR1TCARB', 'DR1TTFAT',
           'DR1TFIBE', 'DR1TVD', 'DR1TVB12', 'DR1TCALC', 'DR1TMOIS', 'BPXOSY1', 'BPXODI1', 'BPXOSY2', 'BPXODI2', 'BPXOSY3', 'BPXODI3',
           'BPXOPLS1', 'BAXTC11']
CATEGORICAL = ['RIAGENDR', 'BAXPF11', 'BAQ110', 'BAQ132', 'BAQ140']
LABELS = {
    'RIDAGEYR': 'Age', 'BMXWT': 'Weight', 'BMXBMI': 'BMI', 'BMXHT': 'Height', 'BMXARMC': 'Arm circumference', 'BMXWAIST': 'Waist',
    'BMXHIP': 'Hip', 'DR1TKCAL': 'Calories', 'DR1TPROT': 'Protein', 'DR1TCARB': 'Carbs', 'DR1TTFAT': 'Fat', 'DR1TFIBE': 'Fiber',
    'DR1TVD': 'Vitamin D', 'DR1TVB12': 'Vitamin B12', 'DR1TCALC': 'Calcium', 'DR1TMOIS': 'Water from diet', 'BPXOSY1': 'Systolic BP 1',
    'BPXODI1': 'Diastolic BP 1', 'BPXOSY2': 'Systolic BP 2', 'BPXODI2': 'Diastolic BP 2', 'BPXOSY3': 'Systolic BP 3', 'BPXODI3': 'Diastolic BP 3',
    'BPXOPLS1': 'Pulse', 'BAXTC11': 'Balance time', 'RIAGENDR': 'Sex', 'BAXPF11': 'Balance test', 'BAQ110': 'Stands unaided',
    'BAQ132': 'Dizzy (24 h)', 'BAQ140': 'Dizzy fall (12 mo)',
}
PARAMS = dict(penalty='l2', C=0.018873918221350976, intercept_scaling=10.0, class_weight=None)


def build():
    numeric = Pipeline([('imp', SimpleImputer(strategy='median', add_indicator=True)), ('sc', StandardScaler())])
    categorical = Pipeline([('imp', SimpleImputer(strategy='constant', fill_value=-1)), ('oh', OneHotEncoder(handle_unknown='ignore'))])
    pre = ColumnTransformer([('num', numeric, NUMERIC), ('cat', categorical, CATEGORICAL)])
    return Pipeline([('pre', pre), ('model', LogisticRegression(solver='liblinear', **PARAMS))])


def main():
    # scikit-learn 1.8+ warns that penalty= is deprecated in favour of l1_ratio=0; the result is identical.
    warnings.filterwarnings('ignore', message=".*'penalty' was deprecated.*")
    df = pd.read_csv(DATA)
    if TARGET not in df.columns:
        sys.exit(f'{DATA} has no {TARGET} column, so the model cannot be (re)trained from it.')
    X, y = df[NUMERIC + CATEGORICAL], df[TARGET].to_numpy()
    assert not set(X.columns) & set(EXCLUDED), 'risk columns must never be model inputs'

    cv = RepeatedStratifiedKFold(n_splits=5, n_repeats=10, random_state=0)
    auc = cross_val_score(build(), X, y, cv=cv, scoring='roc_auc')
    oof = cross_val_predict(build(), X, y, cv=StratifiedKFold(5, shuffle=True, random_state=0), method='predict_proba')[:, 1]
    ceiling = roc_auc_score(y, df['MALNUTRITION_PROBABILITY_SYNTHETIC']) if 'MALNUTRITION_PROBABILITY_SYNTHETIC' in df else None

    model = build().fit(X, y)
    pre, lr = model.named_steps['pre'], model.named_steps['model']
    num_imp, num_sc = pre.named_transformers_['num'].named_steps['imp'], pre.named_transformers_['num'].named_steps['sc']
    onehot = pre.named_transformers_['cat'].named_steps['oh']
    coef = lr.coef_[0]

    indicator_cols = [NUMERIC[i] for i in num_imp.indicator_.features_] if num_imp.indicator_ is not None else []
    n_num = len(NUMERIC) + len(indicator_cols)
    numeric = [{'column': c, 'label': LABELS[c], 'median': float(num_imp.statistics_[i]), 'mean': float(num_sc.mean_[i]),
                'scale': float(num_sc.scale_[i]), 'coef': float(coef[i])} for i, c in enumerate(NUMERIC)]
    missing = [{'column': c, 'label': f'{LABELS[c]} not measured', 'mean': float(num_sc.mean_[len(NUMERIC) + j]),
                'scale': float(num_sc.scale_[len(NUMERIC) + j]), 'coef': float(coef[len(NUMERIC) + j])} for j, c in enumerate(indicator_cols)]
    categorical, k = [], n_num
    for c, cats in zip(CATEGORICAL, onehot.categories_):
        levels = {}
        for value in cats:
            levels[str(int(value))] = float(coef[k])
            k += 1
        categorical.append({'column': c, 'label': LABELS[c], 'missing_code': -1, 'coef_by_value': levels})
    assert k == len(coef)

    probs = model.predict_proba(X)[:, 1]
    picks = np.linspace(0, len(df) - 1, 25).astype(int)
    out = {
        'name': 'NutriSense screening model', 'version': 'ridge_logreg_v1', 'type': 'L2-penalised logistic regression (ridge)',
        'sklearn_params': {f'model__{k}': v for k, v in PARAMS.items()} | {'solver': 'liblinear'},
        'target': TARGET, 'trained_rows': int(len(df)), 'positive_rate': float(y.mean()),
        'excluded_columns': EXCLUDED, 'not_used_by_design': ['RIDRETH3', 'DMDEDUC2', 'DMDMARTZ', 'INDFMPIR', 'RIDSTATR', 'DR1DRSTZ'],
        'validation': {'method': '5-fold stratified CV, repeated 10x', 'auc_mean': float(auc.mean()), 'auc_sd': float(auc.std()),
                       'out_of_fold_auc': float(roc_auc_score(y, oof)), 'label_ceiling_auc': None if ceiling is None else float(ceiling)},
        'intercept': float(lr.intercept_[0]), 'numeric': numeric, 'missing_indicators': missing, 'categorical': categorical,
        # Reference predictions so the JavaScript implementation can be checked against scikit-learn exactly.
        'checks': [{'SEQN': int(df.SEQN.iloc[i]), 'probability': float(probs[i])} for i in picks],
    }
    OUT.write_text(json.dumps(out, indent=1))
    print(f'Cross-validated AUC {auc.mean():.3f} ± {auc.std():.3f} (best possible with this label: {ceiling:.3f})' if ceiling else f'AUC {auc.mean():.3f}')
    print(f'Wrote {OUT} ({len(numeric)} measurements, {len(missing)} missing-value flags, {len(categorical)} answers)')


if __name__ == '__main__':
    main()
