# Package Verification Suite & Manifest Parity

Run the complete test suite across all packages:

```powershell
python config/tests/test_ports_integrity.py; python config/tests/test_internal.py; python config/tests/test_external.py; python runner/tests/test_registry.py; python runner/tests/test_visual_len.py; python runner/tests/test_supervisor.py; python logger/tests/test_internal.py; python logger/tests/test_external.py; npx tsc --noEmit -p logger/tsconfig.json
```
