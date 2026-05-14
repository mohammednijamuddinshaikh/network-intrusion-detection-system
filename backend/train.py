import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
from sklearn.model_selection import train_test_split

cols = [
    'duration','protocol_type','service','flag','src_bytes','dst_bytes','land',
    'wrong_fragment','urgent','hot','num_failed_logins','logged_in','num_compromised',
    'root_shell','su_attempted','num_root','num_file_creations','num_shells',
    'num_access_files','num_outbound_cmds','is_host_login','is_guest_login','count',
    'srv_count','serror_rate','srv_serror_rate','rerror_rate','srv_rerror_rate',
    'same_srv_rate','diff_srv_rate','srv_diff_host_rate','dst_host_count',
    'dst_host_srv_count','dst_host_same_srv_rate','dst_host_diff_srv_rate',
    'dst_host_same_src_port_rate','dst_host_srv_diff_host_rate','dst_host_serror_rate',
    'dst_host_srv_serror_rate','dst_host_rerror_rate','dst_host_srv_rerror_rate',
    'label','difficulty'
]

# Attack category mapping
dos    = ['back','land','neptune','pod','smurf','teardrop','apache2','udpstorm','processtable','mailbomb']
probe  = ['satan','ipsweep','nmap','portsweep','mscan','saint']
r2l    = ['guess_passwd','ftp_write','imap','phf','multihop','warezmaster','warezclient','spy','xlock','xsnoop','snmpguess','snmpgetattack','httptunnel','sendmail','named']
u2r    = ['buffer_overflow','loadmodule','rootkit','perl','sqlattack','xterm','ps']

def map_label(label):
    if label == 'normal': return 'Normal'
    elif label in dos:    return 'DoS'
    elif label in probe:  return 'Probe'
    elif label in r2l:    return 'R2L'
    elif label in u2r:    return 'U2R'
    else:                 return 'Unknown'

train = pd.read_csv("../data/KDDTrain+.txt", names=cols)
test  = pd.read_csv("../data/KDDTest+.txt",  names=cols)
df    = pd.concat([train, test], ignore_index=True)
df.drop(columns=['difficulty'], inplace=True)

df['label'] = df['label'].apply(map_label)
df = df[df['label'] != 'Unknown']

for col in ['protocol_type', 'service', 'flag']:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])

le_label = LabelEncoder()
df['label'] = le_label.fit_transform(df['label'])

X = df.drop(columns=['label'])
y = df['label']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
print(classification_report(y_test, y_pred, target_names=le_label.classes_))

joblib.dump(model,                "model/ids_model.pkl")
joblib.dump(le_label,             "model/label_encoder.pkl")
joblib.dump(list(X.columns),      "model/feature_names.pkl")
print("Model saved.")