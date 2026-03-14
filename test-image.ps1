$token = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwiaWF0IjoxNzczNDA1MTAwLCJleHAiOjE3NzM0OTE1MDB9.dfH0t-Qxoyo9kcLH0KvEAcuPyPcARh0k8xrumWCSbV0UD_4QT-B0qi3g3CWLk6rP1TtkpJgOFHlBRYNzzqe-xg"
$response = Invoke-RestMethod -Uri "http://localhost:8080/api/image/1028" -Headers @{Authorization="Bearer $token"}
$response | ConvertTo-Json -Depth 10
