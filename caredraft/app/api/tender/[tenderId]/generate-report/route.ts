import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface TenderSection {
  id: string
  title: string
  status: string
  owner?: string
  due_date?: string
  word_limit?: number
  word_count?: number
}

interface TenderVolume {
  id: string
  title: string
  sections: TenderSection[]
}

interface ReportData {
  tender: {
    id: string
    title: string
    issuing_authority?: string
    deadline?: string
    contract_value?: number
    region?: string
  }
  volumes: TenderVolume[]
  riskAssessment: {
    riskScore: number
    bidRecommendation: string
    keyRiskFactors: any[]
    complianceGaps: string[]
    recommendations: string[]
  }
  statistics: {
    totalSections: number
    completedSections: number
    progressPercentage: number
    averageWordCount: number
  }
}

const generateHTMLReport = (data: ReportData): string => {
  const { tender, volumes, riskAssessment, statistics } = data
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tender Summary Report - ${tender.title}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #0f766e, #0891b2);
          color: white;
          padding: 30px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0 0 10px 0;
          font-size: 28px;
        }
        .header p {
          margin: 5px 0;
          opacity: 0.9;
        }
        .section {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .section h2 {
          color: #0f766e;
          margin-top: 0;
          border-bottom: 2px solid #0f766e;
          padding-bottom: 10px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }
        .stat-card {
          background: white;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          text-align: center;
        }
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #0f766e;
        }
        .stat-label {
          font-size: 12px;
          color: #6b7280;
          margin-top: 5px;
        }
        .bid-recommendation {
          background: #dcfdf7;
          border: 2px solid #10b981;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 20px 0;
        }
        .bid-recommendation.no-bid {
          background: #fee2e2;
          border-color: #ef4444;
        }
        .bid-recommendation.conditional {
          background: #fef3c7;
          border-color: #f59e0b;
        }
        .recommendation-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .recommendation-title.bid { color: #10b981; }
        .recommendation-title.no-bid { color: #ef4444; }
        .recommendation-title.conditional { color: #f59e0b; }
        .progress-bar {
          background: #e5e7eb;
          border-radius: 10px;
          height: 20px;
          margin: 10px 0;
          overflow: hidden;
        }
        .progress-fill {
          background: linear-gradient(90deg, #10b981, #059669);
          height: 100%;
          transition: width 0.3s ease;
        }
        .volume-card {
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          margin: 15px 0;
          overflow: hidden;
        }
        .volume-header {
          background: #f3f4f6;
          padding: 15px;
          border-bottom: 1px solid #d1d5db;
        }
        .volume-title {
          font-weight: bold;
          color: #374151;
          margin: 0;
        }
        .sections-table {
          width: 100%;
          border-collapse: collapse;
        }
        .sections-table th,
        .sections-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        .sections-table th {
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
        }
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        .status-completed {
          background: #d1fae5;
          color: #065f46;
        }
        .status-in-progress {
          background: #dbeafe;
          color: #1e40af;
        }
        .status-not-started {
          background: #f3f4f6;
          color: #374151;
        }
        .status-review {
          background: #fef3c7;
          color: #92400e;
        }
        .risk-factors {
          margin: 15px 0;
        }
        .risk-factor {
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 15px;
          margin: 10px 0;
        }
        .risk-factor-header {
          display: flex;
          justify-content: between;
          align-items: center;
          margin-bottom: 8px;
        }
        .risk-category {
          font-weight: bold;
          color: #374151;
        }
        .risk-level {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        .risk-high {
          background: #fee2e2;
          color: #991b1b;
        }
        .risk-medium {
          background: #fef3c7;
          color: #92400e;
        }
        .risk-low {
          background: #d1fae5;
          color: #065f46;
        }
        .recommendations-list {
          list-style: none;
          padding: 0;
        }
        .recommendations-list li {
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 12px;
          margin: 8px 0;
          position: relative;
          padding-left: 40px;
        }
        .recommendations-list li:before {
          content: "✓";
          position: absolute;
          left: 15px;
          color: #10b981;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${tender.title}</h1>
        <p><strong>Issuing Authority:</strong> ${tender.issuing_authority || 'Not specified'}</p>
        <p><strong>Submission Deadline:</strong> ${tender.deadline ? new Date(tender.deadline).toLocaleDateString() : 'Not specified'}</p>
        <p><strong>Contract Value:</strong> ${tender.contract_value ? '£' + tender.contract_value.toLocaleString() : 'Not specified'}</p>
        <p><strong>Region:</strong> ${tender.region || 'Not specified'}</p>
      </div>

      <div class="section">
        <h2>📊 Project Statistics</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${statistics.totalSections}</div>
            <div class="stat-label">Total Sections</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${statistics.completedSections}</div>
            <div class="stat-label">Completed</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${Math.round(statistics.progressPercentage)}%</div>
            <div class="stat-label">Progress</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${Math.round(statistics.averageWordCount)}</div>
            <div class="stat-label">Avg Word Count</div>
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${statistics.progressPercentage}%"></div>
        </div>
      </div>

      <div class="section">
        <h2>🎯 Bid Recommendation</h2>
        <div class="bid-recommendation ${riskAssessment.bidRecommendation.toLowerCase().replace('_', '-')}">
          <div class="recommendation-title ${riskAssessment.bidRecommendation.toLowerCase().replace('_', '-')}">
            ${riskAssessment.bidRecommendation.replace('_', ' ')}
          </div>
          <div>Risk Score: <strong>${riskAssessment.riskScore}/100</strong></div>
        </div>
      </div>

      <div class="section">
        <h2>⚠️ Key Risk Factors</h2>
        <div class="risk-factors">
          ${riskAssessment.keyRiskFactors.map(risk => `
            <div class="risk-factor">
              <div class="risk-factor-header">
                <span class="risk-category">${risk.category}</span>
                <span class="risk-level risk-${risk.level}">${risk.level.toUpperCase()}</span>
              </div>
              <div style="color: #6b7280; margin-bottom: 8px;">${risk.risk}</div>
              ${risk.mitigation ? `<div style="color: #059669; font-size: 12px;"><strong>Mitigation:</strong> ${risk.mitigation}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      ${riskAssessment.complianceGaps.length > 0 ? `
        <div class="section">
          <h2>🛡️ Compliance Gaps</h2>
          <ul>
            ${riskAssessment.complianceGaps.map(gap => `<li style="color: #dc2626; margin-bottom: 8px;">${gap}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <div class="section">
        <h2>💡 Recommendations</h2>
        <ul class="recommendations-list">
          ${riskAssessment.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      </div>

      <div class="section">
        <h2>📋 Tender Volumes & Sections</h2>
        ${volumes.map(volume => `
          <div class="volume-card">
            <div class="volume-header">
              <h3 class="volume-title">${volume.title}</h3>
            </div>
            <table class="sections-table">
              <thead>
                <tr>
                  <th>Section</th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th>Due Date</th>
                  <th>Word Count</th>
                </tr>
              </thead>
              <tbody>
                ${volume.sections.map(section => `
                  <tr>
                    <td>${section.title}</td>
                    <td>
                      <span class="status-badge status-${section.status.replace('_', '-')}">
                        ${section.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td>${section.owner || '-'}</td>
                    <td>${section.due_date ? new Date(section.due_date).toLocaleDateString() : '-'}</td>
                    <td>${section.word_count || 0}${section.word_limit ? `/${section.word_limit}` : ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `).join('')}
      </div>

      <div class="footer">
        <p>Generated by CareDraft • ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
      </div>
    </body>
    </html>
  `
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ tenderId: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenderId } = await params

    // Fetch tender data
    const { data: tender, error: tenderError } = await supabase
      .from('tender_workflows')
      .select('*')
      .eq('id', tenderId)
      .eq('user_id', user.id)
      .single()

    if (tenderError) {
      return NextResponse.json({ error: 'Tender not found' }, { status: 404 })
    }

    // Mock data for demonstration
    // In a real implementation, this would fetch actual data from the database
    const mockVolumes: TenderVolume[] = [
      {
        id: 'vol-1',
        title: 'Volume 1: Technical Proposal',
        sections: [
          {
            id: 'sec-1-1',
            title: 'Service Delivery Approach',
            status: 'in_progress',
            owner: 'Alice Smith',
            due_date: '2024-01-25',
            word_limit: 800,
            word_count: 485
          },
          {
            id: 'sec-1-2',
            title: 'Quality Management Framework',
            status: 'not_started',
            owner: 'John Doe',
            due_date: '2024-01-28',
            word_limit: 600,
            word_count: 0
          },
          {
            id: 'sec-1-3',
            title: 'Risk Management Strategy',
            status: 'completed',
            owner: 'Sarah Wilson',
            due_date: '2024-01-22',
            word_limit: 500,
            word_count: 492
          }
        ]
      },
      {
        id: 'vol-2',
        title: 'Volume 2: Commercial Proposal',
        sections: [
          {
            id: 'sec-2-1',
            title: 'Pricing Schedule',
            status: 'not_started',
            owner: 'Mike Johnson',
            due_date: '2024-01-30',
            word_limit: 300,
            word_count: 0
          },
          {
            id: 'sec-2-2',
            title: 'Value for Money Statement',
            status: 'review',
            owner: 'Alice Smith',
            due_date: '2024-01-26',
            word_limit: 750,
            word_count: 742
          }
        ]
      }
    ]

    const mockRiskAssessment = {
      riskScore: 73,
      bidRecommendation: 'BID',
      keyRiskFactors: [
        {
          category: 'Commercial',
          risk: 'Tight pricing requirements',
          level: 'high',
          impact: 8,
          mitigation: 'Value engineering approach'
        },
        {
          category: 'Technical',
          risk: 'Complex integration requirements',
          level: 'medium',
          impact: 6,
          mitigation: 'Leverage existing partnerships'
        },
        {
          category: 'Timeline',
          risk: 'Aggressive delivery schedule',
          level: 'medium',
          impact: 5,
          mitigation: 'Phased implementation'
        }
      ],
      complianceGaps: ['TUPE Compliance', 'Social Value Policy'],
      recommendations: [
        'Review pricing strategy and value proposition',
        'Address compliance gaps before submission',
        'Conduct technical feasibility assessment'
      ]
    }

    // Calculate statistics
    const totalSections = mockVolumes.reduce((acc, vol) => acc + vol.sections.length, 0)
    const completedSections = mockVolumes.reduce((acc, vol) => 
      acc + vol.sections.filter(sec => sec.status === 'completed').length, 0
    )
    const progressPercentage = totalSections > 0 ? (completedSections / totalSections) * 100 : 0
    const totalWordCount = mockVolumes.reduce((acc, vol) => 
      acc + vol.sections.reduce((secAcc, sec) => secAcc + (sec.word_count || 0), 0), 0
    )
    const averageWordCount = totalSections > 0 ? totalWordCount / totalSections : 0

    const reportData: ReportData = {
      tender: {
        id: tender.id,
        title: tender.title,
        issuing_authority: tender.issuing_authority,
        deadline: tender.deadline,
        contract_value: tender.contract_value,
        region: tender.region
      },
      volumes: mockVolumes,
      riskAssessment: mockRiskAssessment,
      statistics: {
        totalSections,
        completedSections,
        progressPercentage,
        averageWordCount
      }
    }

    // Generate HTML report
    const htmlContent = generateHTMLReport(reportData)

    // In a real implementation, you would convert HTML to PDF using a library like Puppeteer
    // For now, we'll return the HTML content
    
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="tender-report-${tenderId}.html"`
      }
    })

  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
} 