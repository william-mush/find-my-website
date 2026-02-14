/**
 * Pre-written email templates for domain recovery scenarios.
 * Users can copy these and fill in the [bracketed] placeholders with their own information.
 */

/**
 * Email template for contacting a registrar about recovering an expired domain.
 */
export function getRegistrarRecoveryEmail(
  domain: string,
  registrar: string
): string {
  return `Subject: Urgent - Domain Recovery Request for ${domain}

Dear ${registrar} Support Team,

I am writing to request assistance with recovering my expired domain name: ${domain}

I am the original registrant of this domain and it has recently expired. I would like to renew it and restore it to active status as soon as possible.

Account Details:
- Domain Name: ${domain}
- Account Email: [your email address on file with ${registrar}]
- Account Username/ID: [your account username or customer ID]
- Registrant Name: [your full name as listed on the registration]

I understand there may be additional fees if the domain has entered the redemption period, and I am prepared to pay any applicable charges to recover it.

Could you please let me know:
1. The current status of the domain (grace period, redemption, or pending delete)
2. What steps I need to take to recover it
3. Any fees that will apply beyond the standard renewal cost
4. The deadline by which I must act to recover the domain

This domain is critical to my [business/organization/personal brand] and I would appreciate your prompt attention to this matter.

Thank you for your help.

Sincerely,
[Your Full Name]
[Your Phone Number]
[Your Email Address]`;
}

/**
 * Email template for making a purchase offer to the current owner of a domain.
 */
export function getDomainPurchaseOfferEmail(
  domain: string,
  offererName?: string
): string {
  const name = offererName ?? "[Your Name]";

  return `Subject: Inquiry About Purchasing ${domain}

Hello,

My name is ${name} and I am interested in acquiring the domain name ${domain}.

I represent [your company/yourself] and we are looking for a domain that fits our [business/project/brand]. After some research, ${domain} stood out as a strong match for our needs.

I would like to inquire whether you would consider selling this domain. If so, I would be happy to discuss a fair price that works for both parties.

A few points for your consideration:
- I am a serious buyer and prepared to move forward quickly
- I am open to using a reputable escrow service (such as Escrow.com) to ensure a safe transaction for both sides
- I am flexible on payment terms if needed

If you are open to selling, could you let me know your asking price or a range you would find acceptable? I am also happy to make an initial offer if you prefer.

If you are not the right person to contact about this, I would appreciate it if you could point me in the right direction.

Thank you for your time, and I look forward to hearing from you.

Best regards,
${name}
[Your Email Address]
[Your Phone Number]
[Your Company Name, if applicable]`;
}

/**
 * Email template for initiating a trademark-based domain dispute.
 */
export function getTrademarkDisputeEmail(
  domain: string,
  trademarkName?: string
): string {
  const mark = trademarkName ?? "[Your Trademark Name]";

  return `Subject: Trademark Infringement Concern - ${domain}

Dear Domain Registrant / Site Administrator,

I am writing on behalf of [Your Company/Organization Name] regarding the domain name ${domain}.

We are the owner of the registered trademark "${mark}" (Registration No. [trademark registration number], registered with [USPTO/EUIPO/other trademark office] on [registration date]). We have been using this mark in commerce since [year of first use].

It has come to our attention that the domain ${domain} is registered and/or being used in a manner that infringes upon our trademark rights. Specifically:

- The domain incorporates our registered trademark "${mark}" [in its entirety / in a confusingly similar manner]
- [The domain is being used to sell competing products/services]
- [The domain is parked and appears to have been registered primarily for the purpose of selling it to us]
- [The domain is being used in a way that could cause consumer confusion]

We respectfully request that you:
1. Cease any use of the domain that infringes upon our trademark
2. Consider transferring the domain to us voluntarily
3. Respond to this notice within 14 business days

We would prefer to resolve this matter amicably and without the need for formal legal proceedings or a UDRP complaint. However, we are prepared to pursue all available legal remedies if necessary, including but not limited to filing a complaint under the Uniform Domain-Name Dispute-Resolution Policy (UDRP).

We are open to discussing reasonable compensation for the voluntary transfer of the domain.

Please direct your response to:
[Your Full Name]
[Your Title]
[Your Company Name]
[Your Email Address]
[Your Phone Number]
[Your Mailing Address]

This letter is without prejudice to any and all rights and remedies available to us, all of which are expressly reserved.

Sincerely,
[Your Full Name]
[Your Title]
[Your Company/Organization Name]`;
}

/**
 * Email template for requesting domain transfer information from a registrar.
 */
/**
 * Email template for a formal cease-and-desist letter addressing cybersquatting.
 */
export function getCeaseAndDesistEmail(
  domain: string,
  trademarkName?: string
): string {
  const mark = trademarkName ?? "[Your Trademark Name]";

  return `Subject: Cease and Desist - Cybersquatting on ${domain}

Dear Domain Registrant,

I am writing on behalf of [Your Company/Organization Name] to formally demand that you cease and desist from the unauthorized use and registration of the domain name ${domain}.

We are the owner of the trademark "${mark}" (Registration No. [trademark registration number], registered with [USPTO/EUIPO/other trademark office]). We have been using this mark in commerce since [year of first use] and have established significant goodwill and reputation associated with it.

The domain ${domain} incorporates our trademark "${mark}" and appears to have been registered in bad faith for the purpose of:
- [Selling the domain to us at an inflated price]
- [Diverting traffic intended for our legitimate business]
- [Causing confusion among consumers]
- [Other bad-faith purpose]

Your registration and use of this domain constitutes cybersquatting and infringes upon our trademark rights under both federal and international law. Specifically, your actions may violate:

1. The Anticybersquatting Consumer Protection Act (ACPA), 15 U.S.C. Section 1125(d), which provides for statutory damages of up to $100,000 per domain name
2. The Uniform Domain-Name Dispute-Resolution Policy (UDRP), which authorizes the transfer of domains registered in bad faith

We hereby demand that you:
1. Immediately cease all use of the domain ${domain}
2. Transfer the domain to us within 14 days of receiving this letter
3. Confirm in writing that you will not register any other domain names incorporating our trademark "${mark}"

If we do not receive a satisfactory response within 14 days, we are prepared to pursue all available legal remedies, including but not limited to:
- Filing a UDRP complaint with WIPO or the National Arbitration Forum
- Initiating legal proceedings under the ACPA in US federal court

We would prefer to resolve this matter without formal proceedings, but we will not hesitate to protect our intellectual property rights.

Please direct your response to:
[Your Full Name]
[Your Title]
[Your Company Name]
[Your Email Address]
[Your Phone Number]
[Your Mailing Address]

This letter is without prejudice to any and all rights and remedies available to us, all of which are expressly reserved.

Sincerely,
[Your Full Name]
[Your Title]
[Your Company/Organization Name]`;
}

/**
 * Email template for reporting unauthorized domain transfer (hijacking) to a registrar's abuse team.
 */
export function getHijackingReportEmail(
  domain: string,
  registrar?: string
): string {
  const registrarName = registrar ?? "[Registrar Name]";

  return `Subject: URGENT - Unauthorized Domain Transfer Report for ${domain}

Dear ${registrarName} Abuse Team,

I am writing to report an unauthorized transfer of my domain name ${domain}. I believe this domain has been hijacked and I am requesting an immediate investigation and domain lock.

Domain Details:
- Domain Name: ${domain}
- Original Registrar: [your original registrar name]
- Original Account Email: [your email address on file]
- Original Registrant Name: [your full name as listed on the registration]
- Date Domain Was Last Under My Control: [date]
- Date Unauthorized Transfer Was Discovered: [date]

I did NOT authorize the transfer of this domain. I have gathered the following evidence to support my claim:

1. [Original domain registration confirmation email showing my ownership]
2. [Payment records (credit card/PayPal receipts) for domain registration and renewals]
3. [Previous WHOIS records showing my name as registrant]
4. [Screenshots of my registrar account showing the domain was managed by me]
5. [Archived copies of my website at web.archive.org]
6. [Any other evidence: DNS records, SSL certificates, email correspondence, etc.]

Under ICANN's Transfer Policy (Section II.A), a transfer must be authorized by the registered name holder. This transfer occurred without my knowledge or consent and may be the result of:
- [Unauthorized access to my registrar account]
- [Social engineering attack against registrar support]
- [Phishing or credential theft]
- [Other suspected method]

I urgently request that you:
1. Immediately place a lock on the domain ${domain} to prevent further transfers or modifications
2. Investigate the circumstances of the unauthorized transfer
3. Initiate the process to reverse the transfer and restore the domain to my account
4. Preserve any logs or records related to the transfer for potential legal proceedings

This domain is critical to my [business/organization] and every day without it causes significant harm. I am prepared to verify my identity through any means you require.

I have also [filed / intend to file] an ICANN Transfer Dispute complaint regarding this matter.

Thank you for your urgent attention to this matter.

Sincerely,
[Your Full Name]
[Your Phone Number]
[Your Email Address]
[Your Account ID/Username with ${registrarName}]`;
}

/**
 * Email template for demanding domain release from a web developer, agency, or provider.
 */
export function getTransferDisputeEmail(
  domain: string,
  provider?: string
): string {
  const providerName = provider ?? "[Provider/Agency Name]";

  return `Subject: Formal Demand for Domain Transfer - ${domain}

Dear ${providerName},

I am writing to formally demand the immediate release and transfer of the domain name ${domain}, which is rightfully owned by me / my organization.

Background:
- Domain Name: ${domain}
- My Company/Name: [Your Company/Organization Name]
- Nature of Relationship: [${providerName} was hired as our web developer/agency/hosting provider]
- Date Relationship Began: [start date]
- Date Relationship Ended or Notice Given: [end date]

Although ${providerName} may have registered or managed the domain ${domain} on our behalf during our business relationship, I am the rightful owner of this domain. [The domain was registered for our business / The domain incorporates our business name / We have been using this domain for our business since (year)].

Under ICANN's Registrar Transfer Policy, the registered name holder has the right to transfer their domain to any registrar of their choosing. A registrar or third party may not refuse to transfer a domain except under specific, limited circumstances defined by ICANN policy (such as active UDRP proceedings or non-payment of fees owed to the current registrar).

I hereby demand that you:
1. Unlock the domain ${domain} and remove any transfer restrictions
2. Provide the EPP/authorization code required to initiate the transfer
3. Ensure the WHOIS administrative contact email is updated to [your email address] so I can approve the transfer
4. Complete these actions within 14 days of receiving this letter

If ${providerName} believes any outstanding invoices are owed, please provide an itemized statement. However, withholding a domain as leverage for unpaid bills is not a valid ground for refusing a transfer under ICANN policy.

If I do not receive a satisfactory response and the domain transfer within 14 days, I intend to:
- File a formal Registrar Transfer Complaint with ICANN
- Report this matter to the relevant registrar's abuse team
- Pursue any additional legal remedies available to me

I strongly prefer to resolve this matter amicably. Please contact me at your earliest convenience to arrange the transfer.

Sincerely,
[Your Full Name]
[Your Phone Number]
[Your Email Address]
[Your Company/Organization Name]`;
}

/**
 * Email template for requesting domain transfer information from a registrar.
 */
export function getRegistrarTransferEmail(
  domain: string,
  currentRegistrar: string,
  newRegistrar: string
): string {
  return `Subject: Domain Transfer Request - ${domain}

Dear ${currentRegistrar} Support Team,

I would like to initiate a transfer of my domain ${domain} from ${currentRegistrar} to ${newRegistrar}.

Account Details:
- Domain Name: ${domain}
- Account Email: [your email address on file]
- Account Username/ID: [your account username or customer ID]
- Registrant Name: [your full name as registered]

I am writing to request the following:

1. Authorization Code (EPP/Auth Code): Please provide the authorization code needed to initiate the transfer with ${newRegistrar}.

2. Transfer Lock: Please confirm that the transfer lock (registrar lock) has been removed from this domain, or advise me on how to remove it from my account settings.

3. WHOIS Contact Verification: Please confirm that the WHOIS contact email address is current and accessible, as I will need to approve the transfer via email.

4. Additional Requirements: Please let me know if there are any other steps, fees, or waiting periods I should be aware of before proceeding.

Important notes:
- The domain must have been registered or last transferred more than 60 days ago for a transfer to proceed. Please confirm this requirement is met.
- I understand the domain will be extended by one year as part of the transfer.

Please process this request at your earliest convenience. If you need to verify my identity, I am happy to provide any required documentation.

Thank you for your assistance.

Sincerely,
[Your Full Name]
[Your Phone Number]
[Your Email Address]`;
}
