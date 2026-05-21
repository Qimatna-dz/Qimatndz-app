netsh advfirewall firewall add rule name="ExpMetro8081" dir=in action=allow protocol=TCP localport=8081
netsh advfirewall firewall add rule name="ExpDev19000" dir=in action=allow protocol=TCP localport=19000
netsh advfirewall firewall add rule name="ExpDev19001" dir=in action=allow protocol=TCP localport=19001
Write-Host "Firewall rules added successfully!" -ForegroundColor Green
