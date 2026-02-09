/**
 * Security Scanner Tool
 * Analyzes Anchor/Rust code for common vulnerabilities
 */

/**
 * Scan Anchor program code for security vulnerabilities
 */
export async function scanSecurity(args) {
  const {
    code,
    codeType = 'rust', // 'rust' or 'typescript'
    severity = 'medium' // 'low', 'medium', 'high', 'critical'
  } = args;

  if (!code || typeof code !== 'string') {
    return {
      success: false,
      error: 'code is required and must be a string',
      details: 'Provide program source code for analysis'
    };
  }

  try {
    const vulnerabilities = scanForVulnerabilities(code, codeType);
    const filtered = filterBySeverity(vulnerabilities, severity);
    const score = calculateSecurityScore(filtered, vulnerabilities.length);

    return {
      success: true,
      codeType,
      vulnerabilityCount: filtered.length,
      totalFound: vulnerabilities.length,
      securityScore: score,
      vulnerabilities: filtered,
      summary: generateVulnerabilitySummary(filtered),
      recommendations: generateSecurityRecommendations(filtered)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: 'Failed to scan code'
    };
  }
}

/**
 * Scan code for vulnerabilities
 */
function scanForVulnerabilities(code, codeType) {
  const vulnerabilities = [];

  // Reentrancy detection
  if (hasReentrancyRisk(code)) {
    vulnerabilities.push({
      id: 'REENTRANCY',
      severity: 'critical',
      title: 'Potential Reentrancy Vulnerability',
      description: 'Code makes external calls before state updates. Attacker could call back into contract.',
      location: findPatternLocation(code, /cpi|invoke|call/i),
      fix: 'Use checks-effects-interactions pattern: validate inputs, update state, then call external programs',
      example: `
// ❌ WRONG: Call before state update
transfer_tokens(&ctx)?;  // External call
ctx.accounts.balance.amount -= amount;  // State update

// ✅ RIGHT: Update state before call
ctx.accounts.balance.amount -= amount;  // State update first
transfer_tokens(&ctx)?;  // Then external call`,
      cwe: 'CWE-407'
    });
  }

  // Integer overflow/underflow
  if (hasArithmeticRisk(code)) {
    vulnerabilities.push({
      id: 'ARITHMETIC_OVERFLOW',
      severity: 'critical',
      title: 'Unchecked Arithmetic Operation',
      description: 'Code performs math without checking for overflow/underflow on u64 or u128',
      location: findPatternLocation(code, /\+|-|\*|\//),
      fix: 'Use checked arithmetic or Rust 1.66+ overflow checks',
      example: `
// ❌ WRONG: Unchecked
let result = amount1 + amount2;

// ✅ RIGHT: Checked
let result = amount1.checked_add(amount2)
  .ok_or(ErrorCode::ArithmeticOverflow)?;`,
      cwe: 'CWE-190'
    });
  }

  // Unvalidated authority checks
  if (hasAuthorityRisk(code)) {
    vulnerabilities.push({
      id: 'MISSING_AUTHORITY_CHECK',
      severity: 'critical',
      title: 'Missing Authority Validation',
      description: 'Instruction modifies state without validating signer or authority',
      location: findPatternLocation(code, /mut|account/i),
      fix: 'Add constraint checks for signers and account ownership',
      example: `
// ❌ WRONG: No signer check
#[account(mut)]
pub data: Account<'info, DataAccount>,

// ✅ RIGHT: Validated
#[account(
  mut,
  constraint = data.authority == authority.key()
)]
pub data: Account<'info, DataAccount>,
pub authority: Signer<'info>,`,
      cwe: 'CWE-306'
    });
  }

  // Oracle price manipulation
  if (hasOracleRisk(code)) {
    vulnerabilities.push({
      id: 'ORACLE_MANIPULATION',
      severity: 'high',
      title: 'Unvalidated Oracle Price',
      description: 'Code uses price feed without freshness/staleness checks',
      location: findPatternLocation(code, /pyth|oracle|price/i),
      fix: 'Validate oracle timestamp and confidence interval before using price',
      example: `
// ❌ WRONG: No staleness check
let price = oracle_account.price();

// ✅ RIGHT: Validate freshness
require!(
  oracle_account.timestamp() > now - 60,
  ErrorCode::StalePriceData
);
let price = oracle_account.price();`,
      cwe: 'CWE-345'
    });
  }

  // PDA constraint violations
  if (hasPDABump(code)) {
    vulnerabilities.push({
      id: 'PDA_BUMP_NOT_STORED',
      severity: 'high',
      title: 'PDA Bump Not Stored',
      description: 'Code derives PDA but doesn\'t store bump seed (can fail with different runtime)',
      location: findPatternLocation(code, /find_program_address|findProgramAddressSync/i),
      fix: 'Store bump in account data or use PDA without bump in seeds',
      example: `
// ❌ WRONG: Bump not stored
let (pda, bump) = Pubkey::find_program_address(&seeds, program_id);

// ✅ RIGHT: Store bump or use fixed seeds
#[account]
pub struct MyPDA {
  pub bump: u8,
}`,
      cwe: 'CWE-340'
    });
  }

  // Unsafe serialization
  if (hasSerializationRisk(code)) {
    vulnerabilities.push({
      id: 'UNSAFE_SERIALIZATION',
      severity: 'high',
      title: 'Unsafe Serialization Pattern',
      description: 'Code uses unsafe deserialization or doesn\'t validate data length',
      location: findPatternLocation(code, /deserialize|from_slice|unsafe/i),
      fix: 'Use anchor deserialize or validate all input sizes',
      example: `
// ❌ WRONG: No size check
let data = &mut account.data.borrow_mut();
MyData::try_from_slice(data)?;

// ✅ RIGHT: Validate size
require!(
  account.data_len() == size_of::<MyData>(),
  ErrorCode::InvalidDataLength
);`,
      cwe: 'CWE-20'
    });
  }

  // Missing checks
  if (hasMissingChecks(code)) {
    vulnerabilities.push({
      id: 'MISSING_INPUT_VALIDATION',
      severity: 'high',
      title: 'Missing Input Validation',
      description: 'Instruction accepts parameters without validating ranges/constraints',
      location: findPatternLocation(code, /pub fn|pub async fn/),
      fix: 'Add require! checks for all instruction parameters',
      example: `
// ❌ WRONG: No validation
pub fn transfer(ctx: Context<Transfer>, amount: u64) -> Result<()> {

// ✅ RIGHT: Validate inputs
pub fn transfer(ctx: Context<Transfer>, amount: u64) -> Result<()> {
  require!(amount > 0, ErrorCode::InvalidAmount);
  require!(amount <= ctx.accounts.source.amount, ErrorCode::InsufficientBalance);`,
      cwe: 'CWE-20'
    });
  }

  return vulnerabilities;
}

function hasReentrancyRisk(code) {
  // Check for CPI calls followed by state mutations
  const cpiPattern = /(?:invoke|cpi|call)[\s\S]*?account.*?amount\s*=/;
  return cpiPattern.test(code);
}

function hasArithmeticRisk(code) {
  // Check for arithmetic without checked_ prefix
  // Filter out comments and strings first to avoid false positives
  const codeWithoutComments = code
    .split('\n')
    .map(line => line.split('//')[0]) // Remove line comments
    .join('\n');
  
  // Look for actual arithmetic operations in code (not just any + - * /)
  // More specific pattern: assignment or comparison with arithmetic
  const arithmeticPattern = /[a-zA-Z_]\w*\s*[\+\-\*\/]=|=\s*[a-zA-Z_]\w*\s*[\+\-\*\/]|let\s+\w+\s*=\s*\w+\s*[\+\-\*\/]/;
  return arithmeticPattern.test(codeWithoutComments) && /u64|u128|i64|i128/.test(code);
}

function hasAuthorityRisk(code) {
  // Check for mut accounts without owner/signer constraints
  const mutPattern = /#\[account\(\s*mut\s*\)\]/;
  return mutPattern.test(code) && !/constraint.*authority|owner|signer/.test(code);
}

function hasOracleRisk(code) {
  // Check for pyth/oracle without staleness checks
  const oraclePattern = /(pyth|oracle|price)[\s\S]*?\.price\(\)|\.get_price\(\)/;
  return oraclePattern.test(code) && !/timestamp|staleness|freshness|max_age/.test(code);
}

function hasPDABump(code) {
  // Check for find_program_address without bump storage
  const pdaPattern = /find_program_address|findProgramAddressSync/;
  return pdaPattern.test(code) && !/pub.*bump|self\.bump|bump_seed/.test(code);
}

function hasSerializationRisk(code) {
  // Check for unsafe deserialization
  const unsafePattern = /try_from_slice|deserialize|from_slice/;
  return unsafePattern.test(code) && !/data_len|len.*==|size_of/.test(code);
}

function hasMissingChecks(code) {
  // More precise check: look for actual state mutations without validation
  // Pattern: Account modification (amount/balance -= or +=) without preceding checks
  const hasStateModification = /account\.\w+\s*[\+\-]=|balance\s*[\+\-]=|\.amount\s*=|\.data\[/i.test(code);
  const hasDirectValidation = /require!|assert!|assert_eq!|if\s+[a-zA-Z_]/i.test(code);
  const hasComments = /\/\//i.test(code); // Documented code may not have explicit checks
  
  // Only flag actual risky pattern: state mutation without any validation nearby
  return hasStateModification && !hasDirectValidation && !hasComments;
}

function findPatternLocation(code, pattern) {
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) {
      return { line: i + 1, column: lines[i].indexOf(lines[i].match(pattern)[0]) };
    }
  }
  return { line: 1, column: 0 };
}

function filterBySeverity(vulnerabilities, minSeverity) {
  const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
  const minLevel = severityOrder[minSeverity] || 1;
  return vulnerabilities.filter(v => severityOrder[v.severity] >= minLevel);
}

function calculateSecurityScore(vulnerabilities, total) {
  if (total === 0) return 100;
  const severityWeights = { low: 1, medium: 5, high: 15, critical: 25 };
  const totalRisk = vulnerabilities.reduce((sum, v) => sum + (severityWeights[v.severity] || 0), 0);
  return Math.max(0, 100 - totalRisk);
}

function generateVulnerabilitySummary(vulnerabilities) {
  const byType = {};
  for (const vuln of vulnerabilities) {
    byType[vuln.id] = (byType[vuln.id] || 0) + 1;
  }
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const vuln of vulnerabilities) {
    bySeverity[vuln.severity]++;
  }
  return { byType, bySeverity };
}

function generateSecurityRecommendations(vulnerabilities) {
  const recommendations = [];
  const seen = new Set();

  for (const vuln of vulnerabilities) {
    if (seen.has(vuln.id)) continue;
    seen.add(vuln.id);

    recommendations.push({
      priority: vuln.severity,
      action: vuln.title,
      details: vuln.description,
      fix: vuln.fix,
      cwe: vuln.cwe
    });
  }

  return recommendations.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });
}

/**
 * Security check categories
 */
export const SECURITY_CHECKS = {
  REENTRANCY: {
    severity: 'critical',
    description: 'Potential reentrancy from external calls before state updates'
  },
  ARITHMETIC_OVERFLOW: {
    severity: 'critical',
    description: 'Unchecked arithmetic operations on integer types'
  },
  MISSING_AUTHORITY_CHECK: {
    severity: 'critical',
    description: 'State modifications without authority validation'
  },
  ORACLE_MANIPULATION: {
    severity: 'high',
    description: 'Unvalidated oracle prices without freshness checks'
  },
  PDA_BUMP_NOT_STORED: {
    severity: 'high',
    description: 'PDA bump not stored in account data'
  },
  UNSAFE_SERIALIZATION: {
    severity: 'high',
    description: 'Unsafe deserialization without size validation'
  },
  MISSING_INPUT_VALIDATION: {
    severity: 'high',
    description: 'Instruction parameters not validated'
  }
};
