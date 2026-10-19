export class JobFallbackFixtures {
  static getMockDomains(field: string) {
    return [
      {
        id: `d1-${Date.now()}`,
        domainName: `${field} - Digital Transformation`,
        subdomains: [
          'Mobile Payment Systems',
          'Open Banking APIs',
          'AI in Credit Scoring',
        ],
      },
      {
        id: `d2-${Date.now()}`,
        domainName: `${field} - Risk Management & Compliance`,
        subdomains: [
          'Credit Risk Modeling',
          'AML/KYC Automation',
          'Basel III Compliance',
        ],
      },
      {
        id: `d3-${Date.now()}`,
        domainName: `${field} - Customer Experience & Retention`,
        subdomains: [
          'Personalization Engines',
          'Chatbot Banking Assistants',
          'Omnichannel Strategy',
        ],
      },
    ];
  }

  static getMockSubdomains(field: string, currentDomains: any[]) {
    if (currentDomains.length > 0) {
      return currentDomains.map((d: any) => ({
        ...d,
        subdomains: Array.from(
          new Set([
            ...(d.subdomains || []),
            'Automated Analytics',
            'Predictive Modeling',
          ]),
        ),
      }));
    }
    return [
      {
        id: 'd1',
        domainName: `${field} Analytics`,
        subdomains: ['Automated Analytics', 'Predictive Modeling'],
      },
    ];
  }

  static getMockTitles(field: string) {
    return [
      {
        title: `AI-Driven Credit Risk Assessment in ${field}`,
        problemStatement: `Commercial entities in ${field} face challenges in accurately assessing credit risk due to fragmented data and lack of advanced ML scoring models.`,
        motivation: `Implementing AI-driven credit scoring models can significantly reduce default ratios and expand financial inclusion.`,
      },
      {
        title: `Digital Transformation Strategy and Customer Retention in ${field}`,
        problemStatement: `Despite investments in digital infrastructure, many entities in ${field} struggle with low adoption rates and customer churn.`,
        motivation: `Understanding the causal relationship between digital maturity and customer retention provides actionable evidence for strategic decisions.`,
      },
      {
        title: `Blockchain Applications for Cross-Border Settlement in ${field}`,
        problemStatement: `Cross-border transactions in ${field} remain expensive, slow, and opaque using traditional correspondent networks.`,
        motivation: `Evaluating real-world blockchain payment implementations provides a deployment framework for regional cost reduction.`,
      },
    ];
  }

  static getMockKeywords(field: string) {
    return {
      keywordsMain: [
        field.toLowerCase(),
        'digital transformation',
        'risk management',
      ],
      keywordsSub: [
        'artificial intelligence',
        'machine learning',
        'data analytics',
      ],
    };
  }

  static getMockPapers(field: string) {
    return [
      {
        title: `Machine Learning Models for ${field}: A Systematic Literature Review`,
        authors: 'Nguyen, T.H., Tran, L.A., & Le, M.D.',
        journal: 'Journal of Academic Research',
        year: 2023,
        openAccess: true,
        downloadedStatus: 'downloaded' as const,
        url: 'https://doi.org/10.1016/j.jft.2023.01.001',
        abstract: `This systematic literature review examines 127 studies on machine learning applications in ${field} published between 2018-2023...`,
      },
      {
        title: `Digital Transformation and Customer Loyalty in Emerging Markets`,
        authors: 'Pham, V.K., Hoang, T.N., & Vo, T.L.',
        journal: 'International Journal of Research',
        year: 2022,
        openAccess: false,
        downloadedStatus: 'pending' as const,
        url: 'https://doi.org/10.1108/IJBM-2022-001',
        abstract: `Using a mixed-methods empirical approach, this study investigates the impact of digital service quality on customer loyalty...`,
      },
      {
        title: `Empirical Analysis of Blockchain Implementations in ${field}`,
        authors: 'Chan, W.S., Tan, B.K., & Lim, J.R.',
        journal: 'Electronic Research & Applications',
        year: 2023,
        openAccess: true,
        downloadedStatus: 'downloaded' as const,
        url: 'https://doi.org/10.1016/j.elerap.2023.01.002',
        abstract: `This paper presents an empirical analysis of blockchain pilots in ${field}. Results show a 78% reduction in settlement latency...`,
      },
    ];
  }

  static getMockOutline(field: string, payload: any) {
    return {
      totalWordCount: payload.totalWordCount || 8000,
      researchType: payload.researchType || 'quantitative',
      headings: [
        {
          id: 'h1',
          title: '1. Introduction',
          targetWordCount: 800,
          ratioPercent: 10,
          overview: `Overview of ${field} research background, problem statement, research objectives, and study significance.`,
          subheadings: [
            { id: 's1', title: '1.1 Research Background', targetWordCount: 400 },
          ],
          referenceIds: [],
        },
        {
          id: 'h2',
          title: '2. Literature Review',
          targetWordCount: 2000,
          ratioPercent: 25,
          overview:
            'Critical review of theoretical models and existing empirical literature.',
          subheadings: [
            { id: 's2', title: '2.1 Theoretical Framework', targetWordCount: 1000 },
          ],
          referenceIds: [],
        },
        {
          id: 'h3',
          title: '3. Research Methodology',
          targetWordCount: 1500,
          ratioPercent: 19,
          overview:
            'Description of research design, data collection methods, sampling, and analytical framework.',
          subheadings: [],
          referenceIds: [],
        },
        {
          id: 'h4',
          title: '4. Findings & Discussion',
          targetWordCount: 2500,
          ratioPercent: 31,
          overview:
            'Presentation of empirical findings, statistical results, and hypothesis testing outcomes.',
          subheadings: [],
          referenceIds: [],
        },
        {
          id: 'h5',
          title: '5. Conclusion',
          targetWordCount: 1200,
          ratioPercent: 15,
          overview:
            'Summary of key contributions, policy recommendations, and future scope.',
          subheadings: [],
          referenceIds: [],
        },
      ],
    };
  }
}
