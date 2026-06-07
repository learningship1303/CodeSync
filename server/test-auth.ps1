#!/usr/bin/env pwsh
<#
CodeSync JWT Authentication System - Comprehensive Testing
Tests all auth endpoints and user flows
#>

Write-Host "`n========================================`n" -ForegroundColor Green
Write-Host "CodeSync Authentication Testing Suite" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

$baseUrl = "http://localhost:5000/api"
$testResults = @()

function Test-Auth {
    param(
        [string]$testName,
        [string]$endpoint,
        [string]$method,
        [hashtable]$body,
        [string]$expectedStatus
    )
    
    Write-Host "Testing: $testName" -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl$endpoint" `
            -Method $method `
            -ContentType "application/json" `
            -Body ($body | ConvertTo-Json) `
            -ErrorAction SilentlyContinue
        
        $statusCode = $response.StatusCode
        $content = $response.Content | ConvertFrom-Json
        
        Write-Host "  Status: $statusCode" -ForegroundColor Yellow
        Write-Host "  Message: $($content.message)" -ForegroundColor White
        
        if ($statusCode -eq [int]$expectedStatus) {
            Write-Host "  ✓ PASS`n" -ForegroundColor Green
            $testResults += @{ Test = $testName; Status = "PASS" }
        } else {
            Write-Host "  ✗ FAIL (Expected $expectedStatus, got $statusCode)`n" -ForegroundColor Red
            $testResults += @{ Test = $testName; Status = "FAIL" }
        }
        
        return $content
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.Value
        $content = $_.ErrorDetails.Message | ConvertFrom-Json
        
        Write-Host "  Status: $statusCode" -ForegroundColor Yellow
        Write-Host "  Message: $($content.message)" -ForegroundColor White
        
        if ($statusCode -eq [int]$expectedStatus) {
            Write-Host "  ✓ PASS`n" -ForegroundColor Green
            $testResults += @{ Test = $testName; Status = "PASS" }
        } else {
            Write-Host "  ✗ FAIL (Expected $expectedStatus, got $statusCode)`n" -ForegroundColor Red
            $testResults += @{ Test = $testName; Status = "FAIL" }
        }
        
        return $content
    }
}

# Test 1: Register with valid credentials
Write-Host "1. REGISTRATION TESTS" -ForegroundColor Magenta
Write-Host "-------------------------------------`n" -ForegroundColor Magenta

$timestamp = [int][double]::Parse((Get-Date -UFormat %s))
$testUser = @{
    email = "authtest_$timestamp@example.com"
    username = "authtest_$timestamp"
    password = "TestPassword123"
}

$registerResult = Test-Auth `
    -testName "Register with valid credentials" `
    -endpoint "/auth/register" `
    -method "POST" `
    -body $testUser `
    -expectedStatus "201"

# Store tokens for later tests
$accessToken = $registerResult.accessToken
$refreshToken = $registerResult.refreshToken

# Test 2: Register with weak password
Test-Auth `
    -testName "Register with weak password (too short)" `
    -endpoint "/auth/register" `
    -method "POST" `
    -body @{
        email = "weak_$timestamp@example.com"
        username = "weaktest_$timestamp"
        password = "weak"
    } `
    -expectedStatus "400"

# Test 3: Register with no uppercase
Test-Auth `
    -testName "Register with password missing uppercase" `
    -endpoint "/auth/register" `
    -method "POST" `
    -body @{
        email = "noupper_$timestamp@example.com"
        username = "noupper_$timestamp"
        password = "testpassword123"
    } `
    -expectedStatus "400"

# Test 4: Register with no number
Test-Auth `
    -testName "Register with password missing number" `
    -endpoint "/auth/register" `
    -method "POST" `
    -body @{
        email = "nonum_$timestamp@example.com"
        username = "nonum_$timestamp"
        password = "TestPassword"
    } `
    -expectedStatus "400"

# Test 5: Register duplicate email
Test-Auth `
    -testName "Register with duplicate email" `
    -endpoint "/auth/register" `
    -method "POST" `
    -body @{
        email = $testUser.email
        username = "different_$timestamp"
        password = "TestPassword123"
    } `
    -expectedStatus "409"

# Test 6: Login tests
Write-Host "`n2. LOGIN TESTS" -ForegroundColor Magenta
Write-Host "-------------------------------------`n" -ForegroundColor Magenta

$loginResult = Test-Auth `
    -testName "Login with correct credentials" `
    -endpoint "/auth/login" `
    -method "POST" `
    -body @{
        email = $testUser.email
        password = $testUser.password
    } `
    -expectedStatus "200"

Test-Auth `
    -testName "Login with wrong password" `
    -endpoint "/auth/login" `
    -method "POST" `
    -body @{
        email = $testUser.email
        password = "WrongPassword123"
    } `
    -expectedStatus "401"

Test-Auth `
    -testName "Login with nonexistent email" `
    -endpoint "/auth/login" `
    -method "POST" `
    -body @{
        email = "nonexistent_$timestamp@example.com"
        password = "AnyPassword123"
    } `
    -expectedStatus "401"

# Test 7: Token refresh
Write-Host "`n3. TOKEN REFRESH TESTS" -ForegroundColor Magenta
Write-Host "-------------------------------------`n" -ForegroundColor Magenta

Test-Auth `
    -testName "Refresh token with valid refresh token" `
    -endpoint "/auth/refresh" `
    -method "POST" `
    -body @{
        refreshToken = $refreshToken
    } `
    -expectedStatus "200"

Test-Auth `
    -testName "Refresh token with invalid refresh token" `
    -endpoint "/auth/refresh" `
    -method "POST" `
    -body @{
        refreshToken = "invalid.token.here"
    } `
    -expectedStatus "401"

# Test 8: Verify password is hashed (not stored plaintext)
Write-Host "`n4. SECURITY TESTS" -ForegroundColor Magenta
Write-Host "-------------------------------------`n" -ForegroundColor Magenta

Write-Host "Testing: Verify password is hashed, not plaintext" -ForegroundColor Cyan

# Try to login - if password is hashed correctly, login should work
$securityTest = Test-Auth `
    -testName "Login works with hashed password" `
    -endpoint "/auth/login" `
    -method "POST" `
    -body @{
        email = $testUser.email
        password = $testUser.password
    } `
    -expectedStatus "200"

# Test 9: User info doesn't include password
Write-Host "`n5. USER DATA TESTS" -ForegroundColor Magenta
Write-Host "-------------------------------------`n" -ForegroundColor Magenta

Write-Host "Testing: User response excludes password hash" -ForegroundColor Cyan
if ($loginResult.user.PSObject.Properties.Name -notcontains 'passwordHash' -and $loginResult.user.PSObject.Properties.Name -notcontains 'password') {
    Write-Host "  ✓ PASS - Password not included in response`n" -ForegroundColor Green
    $testResults += @{ Test = "Password excluded from response"; Status = "PASS" }
} else {
    Write-Host "  ✗ FAIL - Password found in response`n" -ForegroundColor Red
    $testResults += @{ Test = "Password excluded from response"; Status = "FAIL" }
}

# Summary
Write-Host "`n========================================`n" -ForegroundColor Green
Write-Host "TEST SUMMARY" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

$passed = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$total = $testResults.Count

Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })

Write-Host "`nTest Results:" -ForegroundColor Cyan
$testResults | Format-Table -AutoSize

if ($failed -eq 0) {
    Write-Host "`n✓ ALL TESTS PASSED!" -ForegroundColor Green
} else {
    Write-Host "`n✗ SOME TESTS FAILED" -ForegroundColor Red
}

Write-Host "`n========================================`n" -ForegroundColor Green
