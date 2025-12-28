# Windows Firewall Setup for Vite Dev Server

## Issue
Playwright browser cannot connect to localhost dev servers due to Windows Firewall blocking inbound connections.

## Solution
Add firewall rules to allow inbound TCP connections on the Vite dev server ports.

## Instructions (Run as Administrator)

### Option 1: Using PowerShell (Recommended)
Open PowerShell as Administrator and run:

```powershell
New-NetFirewallRule -DisplayName "Vite Dev Server 8765" -Direction Inbound -LocalPort 8765 -Protocol TCP -Action Allow -Profile Private,Public

New-NetFirewallRule -DisplayName "Vite Dev Server 8766" -Direction Inbound -LocalPort 8766 -Protocol TCP -Action Allow -Profile Private,Public
```

### Option 2: Using netsh
Open Command Prompt as Administrator and run:

```cmd
netsh advfirewall firewall add rule name="Vite Dev Server 8765" dir=in action=allow protocol=TCP localport=8765

netsh advfirewall firewall add rule name="Vite Dev Server 8766" dir=in action=allow protocol=TCP localport=8766
```

### Option 3: Using Windows Firewall GUI
1. Open "Windows Defender Firewall with Advanced Security"
2. Click "Inbound Rules" in left panel
3. Click "New Rule..." in right panel
4. Select "Port" → Next
5. Select "TCP" and enter "8765, 8766" → Next
6. Select "Allow the connection" → Next
7. Check all profiles (Domain, Private, Public) → Next
8. Name: "Vite Dev Server" → Finish

## Verification

After adding the rules, verify they exist:

```powershell
Get-NetFirewallRule | Where-Object {$_.DisplayName -like '*Vite*'} | Format-Table DisplayName, Enabled, Direction, Action
```

Or:

```cmd
netsh advfirewall firewall show rule name="Vite Dev Server 8765"
```

## Testing

Once firewall rules are in place, the dev servers should be accessible:
- Dev server: http://localhost:8765/policy-analyzer/
- Preview server: http://localhost:8766/policy-analyzer/

## Cleanup (Optional)

To remove the rules later:

```powershell
Remove-NetFirewallRule -DisplayName "Vite Dev Server 8765"
Remove-NetFirewallRule -DisplayName "Vite Dev Server 8766"
```

Or:

```cmd
netsh advfirewall firewall delete rule name="Vite Dev Server 8765"
netsh advfirewall firewall delete rule name="Vite Dev Server 8766"
```
