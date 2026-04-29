#!/usr/bin/env node

/**
 * Mock SAST Code Scanner
 * Simulates static application security testing by looking for security issues in code
 */

const fs = require('fs');
const path = require('path');

const SECURITY_PATTERNS = [
  {
    pattern: /SECURITY-ISSUE:/gi,
    severity: 'HIGH',
    description: 'Security issue marker found'
  },
  {
    pattern: /VULNERABILITY:/gi,
    severity: 'CRITICAL',
    description: 'Critical vulnerability marker found'
  },
  {
    pattern: /hardcoded.*(?:password|key|token|secret)/gi,
    severity: 'HIGH',
    description: 'Potential hardcoded credentials detected'
  },
  {
    pattern: /TODO.*auth/gi,
    severity: 'MEDIUM',
    description: 'Missing authentication implementation'
  }
];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const findings = [];

  SECURITY_PATTERNS.forEach(({ pattern, severity, description }) => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const lineNumber = content.substring(0, content.indexOf(match)).split('\n').length;
        findings.push({
          file: filePath,
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

function scanDirectory(dirPath, extensions = ['.js', '.ts', '.jsx', '.tsx']) {
  let allFindings = [];

  function walkDir(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== 'scripts') {
        walkDir(itemPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        allFindings = allFindings.concat(scanFile(itemPath));
      }
    }
  }

  walkDir(dirPath);
  return allFindings;
}

function generateReport(findings) {
  const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length;
  const highCount = findings.filter(f => f.severity === 'HIGH').length;
  const mediumCount = findings.filter(f => f.severity === 'MEDIUM').length;

  const report = {
    timestamp: new Date().toISOString(),
    status: criticalCount > 0 || highCount > 0 ? 'FAIL' : 'PASS',
    summary: {
      total: findings.length,
      critical: criticalCount,
      high: highCount,
      medium: mediumCount
    },
    findings: findings
  };

  return report;
}

// Main execution
function main() {
  const targetDir = process.argv[2] || '.';
  const outputFile = process.argv[3] || 'code-scan-results.json';

  console.log('🔍 Starting SAST Code Scan...');
  console.log(`Scanning directory: ${targetDir}`);

  try {
    const findings = scanDirectory(targetDir);
    const report = generateReport(findings);

    // Write report to file
    fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));

    // Console output
    console.log(`\n📊 Scan Results:`);
    console.log(`Status: ${report.status}`);
    console.log(`Total Issues: ${report.summary.total}`);
    console.log(`  Critical: ${report.summary.critical}`);
    console.log(`  High: ${report.summary.high}`);
    console.log(`  Medium: ${report.summary.medium}`);

    if (findings.length > 0) {
      console.log(`\n🚨 Issues Found:`);
      findings.forEach(finding => {
        console.log(`  [${finding.severity}] ${finding.file}:${finding.line} - ${finding.description}`);
        console.log(`    Evidence: ${finding.evidence}`);
      });
    }

    console.log(`\n📄 Full report saved to: ${outputFile}`);

    // Set GitHub Actions output
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `scan-status=${report.status}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `issues-count=${report.summary.total}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `critical-issues=${report.summary.critical}\n`);
    }

    // Exit with appropriate code
    process.exit(report.status === 'FAIL' ? 1 : 0);

  } catch (error) {
    console.error('❌ Scan failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { scanFile, scanDirectory, generateReport };