# Vanta Signal — Linq Platform Risk Memo

**Version:** 2.0
**Date:** 2026-03-12
**Author:** Manus, Chief of Staff

---

## 1. Executive Summary (BLUF)

This memo addresses the platform risk associated with our use of Linq for iMessage/SMS signal ingestion, as flagged by the VP of Engineering. The core issue is not technical but strategic: **Linq operates in a gray area of Apple’s ecosystem, and this dependency introduces a significant, unquantifiable supply chain risk.**

Linq has raised ~$22.5M from credible investors (TQ Ventures, Mucker Capital) by pivoting to become the infrastructure for AI agents inside iMessage. Their flagship customer, Poke, went viral and validated the market. However, their technical method—emulating iMessage on a "Mac farm"—is not sanctioned by Apple and likely violates the iOS EULA. Apple could terminate this service at any time, without warning.

**The recommendation is to acknowledge, isolate, and de-risk this dependency.** We should not build further on top of Linq, but we should continue to leverage it for the prototype while accelerating our native channel capabilities (Phone/ConnectX) which represent a defensible, owned infrastructure moat.

## 2. The Linq Business Model: A Double-Edged Sword

Linq’s success is a direct result of its willingness to operate where others cannot. They provide a service—programmatic, blue-bubble iMessage access—that has massive demand but no sanctioned API. This has allowed them to achieve impressive metrics:

| Metric | Value | Source |
|:---|:---|:---|
| **Series A** | $20M | TechCrunch [1] |
| **Lead Investor** | TQ Ventures | TechCrunch [1] |
| **Net Revenue Retention** | 295% | TechCrunch [1] |
| **Monthly Messages** | 30M+ | TechCrunch [1] |
| **Flagship Customer** | Poke (AI Assistant) | TechCrunch [1] |

Their pivot from a digital business card company to an AI messaging infrastructure layer was catalyzed by Poke, a well-funded ($15M seed from General Catalyst) AI assistant that went viral. This proves the market for AI agents inside iMessage is real. However, it also paints a larger target on Linq’s back.

## 3. The Platform Risk: One EULA Update Away from Extinction

The core risk is simple: **Apple is the platform, and Linq is a tenant operating without a lease.**

> "There’s no telling if Apple will pull a Meta and bar third parties from offering AI chatbots on its platform." — TechCrunch [1]

This is not a hypothetical. History is littered with companies that built on top of platforms without permission, only to be shut down when the platform owner changed the rules. The risk is not that Linq’s tech will fail; the risk is that Apple’s legal or technical teams will succeed.

**How Apple could shut Linq down:**
1.  **TOS Enforcement:** A cease-and-desist letter for violating the iOS End User License Agreement.
2.  **Technical Block:** A server-side update to iMessage that detects and blocks emulated clients from Mac farms.
3.  **Legal Action:** Direct legal proceedings against Linq for unauthorized use of their network.

Any of these actions would be swift and would instantly terminate Vanta’s iMessage/SMS signal feed.

## 4. Strategic Recommendations

Our architecture is channel-agnostic, which is our primary defense. If the `linq` source goes dark, the `recall`, `phone`, and `gmail` sources continue to function. The platform survives. However, we must be proactive.

1.  **Acknowledge and Isolate:** This memo serves as the formal acknowledgment. The `linq-webhook` and `linq-send` functions represent the full surface area of the integration. No new features should be built that deepen this dependency.

2.  **De-risk and Diversify:** The strategic priority must be the channels Vanta owns and controls. The native phone integration via ConnectX is the defensible moat. It is not subject to the whims of a third-party platform owner. We should accelerate the roadmap for native SMS/RCS capabilities through our own MVNO infrastructure.

3.  **Monitor, Don’t Invest:** We should continue to use Linq for the prototype as it provides valuable data on user interaction with text-based signals. However, we should not invest significant engineering resources in building features specific to the Linq channel (e.g., iMessage-specific reactions, tapbacks, or media).

## 5. Conclusion

The VP of Engineering’s assessment is correct. The risk is real. But it is a manageable business risk, not a fatal technical flaw. Linq is a valuable but volatile asset. We will treat it as such: a bridge to a fully-owned, multi-channel future, not the foundation of it.

---

### References

[1] [Linq raises $20M to enable AI assistants to live within messaging apps](https://techcrunch.com/2026/02/02/linq-raises-20m-to-enable-ai-assistants-to-live-within-messaging-apps/) (TechCrunch, Feb 2, 2026)
