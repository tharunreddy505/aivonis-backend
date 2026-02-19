# Fonio: Project Resources & Pricing Guide

This document provides a comprehensive overview of the technology stack, external resources, and associated pricing models used in the **Fonio** project.

## 1. Technology Stack

### **Core Framework & Language**
*   **Next.js 16 (App Router)**: The primary full-stack web framework handling both frontend UI and backend API routes.
*   **React 19**: The JavaScript library for building user interfaces.
*   **TypeScript**: Used throughout the application for static type definitions and code safety.

### **Database & Data Management**
*   **SQLite**: The relational database engine used for local development (`dev.db`).
*   **Prisma ORM**: The Object-Relational Mapper used to define schema and interact with the database.
    *   *Managed Models*: `User`, `Agent`, `Call`, `Transcript`, `Settings`, `PhoneNumber`.

### **UI & Styling**
*   **Tailwind CSS v4**: Utility-first CSS framework for rapid UI development.
*   **Lucide React**: The icon library used for all UI icons.
*   **NextAuth.js (v5 Beta)**: Authentication solution for handling user sessions and security.

### **Utilities**
*   **Nodemailer**: Library for sending emails (e.g., sending call transcripts via SMTP).
*   **Bcrypt**: Library for hashing passwords securely.

---

## 2. External Cloud Services & Resources

### **A. OpenAI (Artificial Intelligence)**
Used for the core "brain" of the voice agent.
*   **Model**: `gpt-4o-mini`
    *   *Usage*: Generates conversational responses based on user input and agent system prompts.
    *   *Translation*: Capable of translating call transcripts into other languages.
*   **Text-to-Speech (TTS)**: `tts-1` (Standard)
    *   *Usage*: **Browser Previews**. Used when you listen to a voice sample in the dashboard.
    *   *Voices*: Uses presets like `onyx`, `shimmer`, `nova`, `alloy`, `echo`, `fable`.

### **B. Twilio (Telephony infrastructure)**
Used for connecting the agent to the real-world telephone network.
*   **Programmable Voice**: Handles inbound/outbound calls and manages call control flow (TwiML).
*   **Text-to-Speech**: Uses **Amazon Polly (Neural)** for live phone calls.
    *   *Usage*: Converts the AI's response to audio on the phone line.
    *   *Voices*: Maps OpenAI names to Polly equivalents (e.g., Shimmer -> `Polly.Joanna-Neural`).
*   **Phone Numbers**: Provisioning of local or toll-free numbers for agents.
*   **Call Recording**: Records audio of the conversations for transcription and review.

---

## 3. Pricing Breakdown

Prices listed are estimated based on standard US rates as of early 2025. Actual costs may vary by region and volume.

### **OpenAI Pricing**

| Service | Model | Metric | Price (USD) |
| :--- | :--- | :--- | :--- |
| **Intelligence (Input)** | `gpt-4o-mini` | Per 1M Tokens | **$0.15** |
| **Intelligence (Output)** | `gpt-4o-mini` | Per 1M Tokens | **$0.60** |
| **Text-to-Speech** | `tts-1` | Per 1M Characters | **$15.00** |

*   *Note: `gpt-4o-mini` is highly optimized for cost. A "token" is roughly 0.75 words. 1M tokens is approx the size of 5 standard novels.*
*   *Note: OpenAI `tts-1` is used for **audio previews** in the browser.*

### **Twilio Pricing (US)**

| Service | Feature | Metric | Price (USD) |
| :--- | :--- | :--- | :--- |
| **Phone Number** | Local Number | Per Month | **$1.15** |
| | Toll-Free Number | Per Month | **$2.15** |
| **Voice Calls** | Inbound (Receive) | Per Minute | **$0.0085** |
| | Outbound (Make) | Per Minute | **$0.013** |
| **Text-to-Speech** | **Amazon Polly (Neural)** | Per 1M Char | **~$16.00** (Used during calls) |
| **Recording** | Call Recording | Per Minute | **$0.0025** |
| **Storage** | Recording Storage | Per Minute/Month | **$0.0005** (First 10k free) |

---

## 4. Cost Simulation Example

**Scenario:** A single **5-minute** customer support call handled by the AI agent.

1.  **Telephony (Twilio Inbound)**
    *   Cost: 5 mins × $0.0085 = **$0.0425**
2.  **Recording (Twilio)**
    *   Cost: 5 mins × $0.0025 = **$0.0125**
3.  **AI Intelligence (OpenAI)**
    *   *Assumption*: ~20 turns of conversation (~2,000 tokens total).
    *   Cost: (2,000 / 1,000,000) × Avg($0.30) ≈ **$0.001** (Negligible)
4.  **Twilio TTS (Amazon Polly)**
    *   *Usage*: AI speaks ~3,000 characters during the call.
    *   *Note*: The phone system uses Amazon Polly Neural voices (via Twilio), not OpenAI.
    *   Cost: ~3,000 chars × ($16.00 / 1M) ≈ **$0.0480**

### **Total Estimated Cost per 5-min Call: ~$0.103 USD**

*Plus the fixed monthly cost of the phone number ($1.15/mo).*
