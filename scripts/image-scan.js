#!/usr/bin/env node

/**
 * Mock Container Image Scanner
 * Simulates container image security scanning by checking Dockerfile and image metadata
 */

const fs = require('fs');
const path = require('path');

const IMAGE_SECURITY_PATTERNS = [
  {
    pattern: /#.*VULNERABILITY:/gi,
    severity: 'CRITICAL',
    description: 'Critical vulnerability marker found in Dockerfile'
  },
  {
    pattern: /FROM\s+.*:latest/gi,
    severity: 'MEDIUM',
    description: 'Using latest tag - not recommended for production'
  },
  {
    pattern: /USER\s+root/gi,
    severity: 'HIGH',
    description: 'Running container as root user'
  },
  {
    pattern: /#.*SECURITY-ISSUE:/gi,
    severity: 'HIGH',
    description: 'Security issue marker found in Dockerfile'
  },
  {
    pattern: /COPY\s+\*\s+/gi,
    severity: 'LOW',
    description: 'Copying all files - consider using .dockerignore'
  }
];

const VULNERABILITY_DB = {
  'node:18-alpine': {
    vulnerabilities: 0,
    severity: 'NONE'
  },
  'node:16-alpine': {
    vulnerabilities: 2,
    severity: 'LOW',
    details: ['CVE-2023-0001: Low severity npm issue', 'CVE-2023-0002: Low severity openssl issue']
  },
  'ubuntu:20.04': {
    vulnerabilities: 15,
    severity: 'HIGH',
    details: ['CVE-2023-1001: High severity kernel issue', 'Multiple medium severity package issues']
  },
  'ubuntu:18.04': {
    vulnerabilities: 27,
    severity: 'CRITICAL',
    details: ['CVE-2023-9001: Critical glibc remote code execution', 'Multiple critical base package vulnerabilities']
  }
};

function scanDockerfile(dockerfilePath) {
  const findings = [];
  
  if (!fs.existsSync(dockerfilePath)) {
    return [{
      type: 'dockerfile',
      severity: 'LOW',
      description: 'No Dockerfile found',
      evidence: 'Missing Dockerfile'
    }];
  }

  const content = fs.readFileSync(dockerfilePath, 'utf8');

  IMAGE_SECURITY_PATTERNS.forEach(({ pattern, severity, description }) => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const lineNumber = content.substring(0, content.indexOf(match)).split('\n').length;
        findings.push({
          type: 'dockerfile',
          file: dockerfilePath,
          line: lineNumber,
          severity,
          description,
          evidence: match.trim()
        });
      });
    }
  });

  return findings;
}

function scanBaseImage(dockerfilePath) {
  const findings = [];
  
  if (!fs.existsSync(dockerfilePath)) {
    return findings;
  }

  const content = fs.readFileSync(dockerfilePath, 'utf8');
  const fromMatch = content.match(/FROM\s+([^\s\n]+)/i);
  
  if (fromMatch) {
    const baseImage = fromMatch[1];
    const vulnData = VULNERABILITY_DB[baseImage];
    
    if (vulnData && vulnData.vulnerabilities > 0) {
      findings.push({
        type: 'base-image',
        severity: vulnData.severity,
        description: `Base image has ${vulnData.vulnerabilities} known vulnerabilities`,
        evidence: baseImage,
        details: vulnData.details || []
      });
    }
  }

  return findings;
}

function checkImageCompliance() {
  // Simulate compliance checks
  const findings = [];
  
  // Check for common compliance issues
  const packageJsonPath = './package.json';
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!packageJson.license) {
      findings.push({
        type: 'compliance',
        severity: 'MEDIUM',
        description: 'No license specified in package.json',
        evidence: 'Missing license field'
      });
    }
  }

  return findings;
}

function generateImageReport(allFindings) {
  const criticalCount = allFindings.filter(f => f.severity === 'CRITICAL').length;
  const highCount = allFindings.filter(f => f.severity === 'HIGH').length;
  const mediumCount = allFindings.filter(f => f.severity === 'MEDIUM').length;
  const lowCount = allFindings.filter(f => f.severity === 'LOW').length;

  // Determine overall status
  let status = 'PASS';
  if (criticalCount > 0) {
    status = 'FAIL';
  } else if (highCount > 5) { // Allow some high severity but fail if too many
    status = 'FAIL';
  }

  const report = {
    timestamp: new Date().toISOString(),
    status: status,
    image: 'actions-gate-demo:latest',
    summary: {
      total: allFindings.length,
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      low: lowCount
    },
    findings: allFindings
  };

  return report;
}

// Main execution
function main() {
  const dockerfilePath = process.argv[2] || './Dockerfile';
  const outputFile = process.argv[3] || 'image-scan-results.json';

  console.log('🐳 Starting Container Image Security Scan...');
  console.log(`Scanning Dockerfile: ${dockerfilePath}`);

  try {
    let allFindings = [];

    // Scan Dockerfile
    const dockerfileFindings = scanDockerfile(dockerfilePath);
    allFindings = allFindings.concat(dockerfileFindings);

    // Scan base image for vulnerabilities
    const baseImageFindings = scanBaseImage(dockerfilePath);
    allFindings = allFindings.concat(baseImageFindings);

    // Check compliance
    const complianceFindings = checkImageCompliance();
    allFindings = allFindings.concat(complianceFindings);

    const report = generateImageReport(allFindings);

    // Write report to file
    fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));

    // Console output
    console.log(`\n📊 Image Scan Results:`);
    console.log(`Status: ${report.status}`);
    console.log(`Image: ${report.image}`);
    console.log(`Total Issues: ${report.summary.total}`);
    console.log(`  Critical: ${report.summary.critical}`);
    console.log(`  High: ${report.summary.high}`);
    console.log(`  Medium: ${report.summary.medium}`);
    console.log(`  Low: ${report.summary.low}`);

    if (allFindings.length > 0) {
      console.log(`\n🚨 Issues Found:`);
      allFindings.forEach(finding => {
        console.log(`  [${finding.severity}] ${finding.type.toUpperCase()} - ${finding.description}`);
        console.log(`    Evidence: ${finding.evidence}`);
        if (finding.details && finding.details.length > 0) {
          finding.details.forEach(detail => {
            console.log(`    Detail: ${detail}`);
          });
        }
      });
    }

    console.log(`\n📄 Full report saved to: ${outputFile}`);

    // Set GitHub Actions output
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `scan-status=${report.status}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `issues-count=${report.summary.total}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `critical-issues=${report.summary.critical}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `high-issues=${report.summary.high}\n`);
    }

    // Vulnerability findings are enforced by dedicated workflow gate jobs.
    // Only scanner execution errors should fail this step directly.
    process.exit(0);

  } catch (error) {
    console.error('❌ Image scan failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { scanDockerfile, scanBaseImage, checkImageCompliance, generateImageReport };
