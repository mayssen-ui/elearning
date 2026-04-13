# Fix all pom.xml parent references
$services = @(
    "api-gateway",
    "course-service",
    "progress-service",
    "feedback-service",
    "chat-service",
    "badge-service",
    "leaderboard-service",
    "analytics-service",
    "config-server"
)

$parentRef = @"
    <parent>
        <groupId>com.elearning</groupId>
        <artifactId>spring-boot-services</artifactId>
        <version>1.0.0</version>
        <relativePath>../pom.xml</relativePath>
    </parent>
"@

foreach ($service in $services) {
    $pomPath = "backend/spring-boot-services/$service/pom.xml"
    if (Test-Path $pomPath) {
        Write-Host "Processing $service..."
        $content = Get-Content $pomPath -Raw
        
        # Check if already has our parent
        if ($content -match "spring-boot-services") {
            Write-Host "  Already fixed, skipping"
            continue
        }
        
        # Replace parent section
        $newContent = $content -replace '(?s)<parent>.*?</parent>', $parentRef
        Set-Content $pomPath $newContent -NoNewline
        Write-Host "  Fixed!"
    } else {
        Write-Host "WARNING: $pomPath not found"
    }
}

Write-Host ""
Write-Host "All pom.xml files fixed!"
Write-Host "Now reload Maven projects in your IDE."
