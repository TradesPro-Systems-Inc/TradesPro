# api/packager.py
import json, hashlib, base64, os
from datetime import datetime
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
# from cryptography.hazmat.primitives.asymmetric.utils import encode_dss_signature

KEY_PATH = os.path.join(os.path.dirname(__file__), "signing_key.pem")
PRIVATE_KEY = ec.generate_private_key(ec.SECP256R1())

def _ensure_key():
    if not os.path.exists(KEY_PATH):
        # generate private key and write (PEM)
        priv = ec.generate_private_key(ec.SECP256R1())
        pem = priv.private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.PKCS8,
            serialization.NoEncryption()
        )
        with open(KEY_PATH, "wb") as f:
            f.write(pem)
    # load key
    with open(KEY_PATH, "rb") as f:
        priv = serialization.load_pem_private_key(f.read(), password=None)
    return priv

def canonicalize_bundle(bundle):
    """
    Deterministic JSON canonicalization for our use:
    - sort keys
    - separators without spaces
    - numbers formatted as fixed with 6 decimals where possible (optional)
    """
    def normalize(obj):
        # recursive normalize: format floats to fixed 6 decimals as strings for determinism
        if isinstance(obj, float):
            return format(obj, '.6f')
        if isinstance(obj, dict):
            return {k: normalize(obj[k]) for k in sorted(obj.keys())}
        if isinstance(obj, list):
            return [normalize(x) for x in obj]
        return obj
    norm = normalize(bundle)
    return json.dumps(norm, separators=(',', ':'), ensure_ascii=False)

def compute_root_hash(canonical_json):
    h = hashlib.sha256()
    h.update(canonical_json.encode('utf-8'))
    return h.hexdigest()

def sign_root_hash(root_hash_hex):
    priv = _ensure_key()
    # sign the raw bytes of the hex string
    sig = priv.sign(bytes.fromhex(root_hash_hex), ec.ECDSA(hashes.SHA256()))
    # ECDSA returns ASN.1 DER signature; base64-encode it
    return base64.b64encode(sig).decode('ascii')

def package_and_sign(unsigned_bundle: dict):
    canonical = canonicalize(unsigned_bundle)
    digest = hashlib.sha256(canonical.encode("utf-8")).digest()
    signature = PRIVATE_KEY.sign(digest, ec.ECDSA(hashes.SHA256()))
    sig_b64 = base64.b64encode(signature).decode("utf-8")

    return {
        "unsignedBundle": unsigned_bundle,
        "canonical": canonical,
        "rootHash": hashlib.sha256(canonical.encode()).hexdigest(),
        "signature": {
            "signer": "tradespro-demo-engine",
            "algorithm": "ECDSA-P256-SHA256",
            "signature": sig_b64,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    }

def canonicalize(data):
    """排序键的JSON序列化"""
    return json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(",", ":"))

