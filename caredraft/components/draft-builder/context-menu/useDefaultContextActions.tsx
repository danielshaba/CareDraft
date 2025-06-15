'use client'

import { useEffect } from 'react'
import { 
  ExpandIcon, 
  HelpCircle, 
  BarChart3, 
  FileText, 
  Zap, 
  CheckCircle2, 
  RefreshCw, 
  Type,
  PlusCircle,
  Languages,
  Volume2,
  Scissors,
  Search,
  Lightbulb
} from 'lucide-react'
import { useContextMenu, ContextMenuAction } from './ContextMenuProvider'

export const useDefaultContextActions = () => {
  const { registerAction, unregisterAction } = useContextMenu()

  // Helper function to call AI endpoints
  const callAIEndpoint = async (endpoint: string, data: any): Promise<any> => {
    try {
      const response = await fetch(`/api/ai/context-actions/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`AI operation failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`AI endpoint error (${endpoint}):`, error)
      throw error
    }
  }

  // Helper function to replace selected text in editor
  const replaceSelectedText = (newText: string) => {
    try {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        range.insertNode(document.createTextNode(newText))
        
        // Clear selection
        selection.removeAllRanges()
        
        console.log('Text replaced successfully')
        return true
      }
    } catch (error) {
      console.error('Failed to replace text:', error)
    }
    return false
  }

  // Helper function to show operation status
  const showStatus = (message: string, isError = false) => {
    // Simple console logging for now - could be replaced with toast notifications
    if (isError) {
      console.error(`Context Menu: ${message}`)
    } else {
      console.log(`Context Menu: ${message}`)
    }
  }

  useEffect(() => {
    const actions: ContextMenuAction[] = [
      // EVIDENCING Actions
      {
        id: 'expand',
        label: 'Expand',
                 description: 'Add more detail and expand content',
         category: 'EVIDENCING',
         icon: ExpandIcon,
        handler: async (selectedText) => {
          showStatus('Expanding content...')
          try {
            const result = await callAIEndpoint('expand', {
              text: selectedText.text,
              expandType: 'detailed',
              preserveTone: true,
              targetLength: 'moderate'
            })
            
            if (result.success && result.expandedText) {
              if (replaceSelectedText(result.expandedText)) {
                showStatus('Content expanded successfully')
              } else {
                showStatus('Content generated but failed to replace text', true)
              }
            } else {
              showStatus('Failed to expand content', true)
            }
                     } catch (error) {
             showStatus(`Expansion failed: ${error instanceof Error ? error.message : 'Unknown error'}`, true)
          }
        }
      },
      {
        id: 'explain-how',
        label: 'Explain How',
        description: 'Add step-by-step explanations',
        category: 'EVIDENCING',
        icon: HelpCircle,
        handler: async (selectedText) => {
          showStatus('Generating explanation...')
          try {
            const result = await callAIEndpoint('explain', {
              text: selectedText.text,
              explanationType: 'how',
              includeSteps: true,
              detail: 'standard'
            })
            
            if (result.success && result.explanation) {
              if (replaceSelectedText(result.explanation)) {
                showStatus('Explanation added successfully')
              } else {
                showStatus('Explanation generated but failed to replace text', true)
              }
            } else {
              showStatus('Failed to generate explanation', true)
            }
          } catch (error) {
            showStatus(`Explanation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, true)
          }
        }
      },
      {
        id: 'add-statistics',
        label: 'Add Statistics',
        description: 'Include relevant statistics and data',
        category: 'EVIDENCING',
        icon: BarChart3,
        handler: async (selectedText) => {
          showStatus('Finding relevant statistics...')
          try {
            const result = await callAIEndpoint('statistics', {
              text: selectedText.text,
              sector: 'care',
              sourcePreference: 'government',
              statisticType: 'performance'
            })
            
            if (result.success && result.enhancedText) {
              if (replaceSelectedText(result.enhancedText)) {
                showStatus('Statistics added successfully')
              } else {
                showStatus('Statistics generated but failed to replace text', true)
              }
            } else {
              showStatus('Failed to find relevant statistics', true)
            }
          } catch (error) {
            showStatus(`Statistics search failed: ${error instanceof Error ? error.message : 'Unknown error'}`, true)
          }
        }
      },
      {
        id: 'add-case-study',
        label: 'Add Case Study',
        description: 'Include relevant case studies and examples',
        category: 'EVIDENCING',
        icon: FileText,
        handler: async (selectedText) => {
          showStatus('Finding relevant case study...')
          try {
            const result = await callAIEndpoint('case-study', {
              text: selectedText.text,
              sector: 'care',
              caseType: 'success',
              includeOutcomes: true
            })
            
            if (result.success && result.enhancedText) {
              if (replaceSelectedText(result.enhancedText)) {
                showStatus('Case study added successfully')
              } else {
                showStatus('Case study generated but failed to replace text', true)
              }
            } else {
              showStatus('Failed to find relevant case study', true)
            }
          } catch (error) {
            showStatus(`Case study search failed: ${error instanceof Error ? error.message : 'Unknown error'}`, true)
          }
        }
      },

      // EDITING Actions
      {
        id: 'summarise',
        label: 'Summarise',
        description: 'Create a concise summary',
        category: 'EDITING',
        icon: Zap,
        handler: async (selectedText) => {
          showStatus('Creating summary...')
          try {
            const result = await callAIEndpoint('summarize', {
              text: selectedText.text,
              length: 'standard',
              style: 'paragraph',
              preserveKeyPoints: true
            })
            
            if (result.success && result.summary) {
              if (replaceSelectedText(result.summary)) {
                showStatus(`Summary created (${result.compressionRatio * 100}% compression)`)
              } else {
                showStatus('Summary generated but failed to replace text', true)
              }
            } else {
              showStatus('Failed to create summary', true)
            }
          } catch (error) {
            showStatus(`Summarization failed: ${error instanceof Error ? error.message : 'Unknown error'}`, true)
          }
        }
      },
      {
        id: 'improve-grammar',
        label: 'Improve Grammar',
        description: 'Fix grammar and language issues',
        category: 'EDITING',
        icon: CheckCircle2,
        handler: async (selectedText) => {
          showStatus('Improving grammar...')
          try {
            const result = await callAIEndpoint('grammar', {
              text: selectedText.text,
              level: 'standard',
              preserveStyle: true,
              ukEnglish: true
            })
            
            if (result.success && result.correctedText) {
              if (replaceSelectedText(result.correctedText)) {
                showStatus(`Grammar improved (${result.corrections?.length || 0} corrections)`)
              } else {
                showStatus('Grammar corrections generated but failed to replace text', true)
              }
            } else {
              showStatus('Failed to improve grammar', true)
            }
          } catch (error) {
            showStatus(`Grammar improvement failed: ${error instanceof Error ? error.message : 'Unknown error'}`, true)
          }
        }
      },
      {
        id: 'change-tense',
        label: 'Change Tense',
        description: 'Convert to different tense',
        category: 'EDITING',
        icon: RefreshCw,
        handler: async (selectedText) => {
          showStatus('Converting tense...')
          try {
            const result = await callAIEndpoint('tense-change', {
              text: selectedText.text,
              targetTense: 'present',
              preserveMeaning: true,
              maintainVoice: true
            })
            
            if (result.success && result.convertedText) {
              if (replaceSelectedText(result.convertedText)) {
                showStatus(`Tense converted to ${result.targetTense}`)
              } else {
                showStatus('Tense conversion generated but failed to replace text', true)
              }
            } else {
              showStatus('Failed to convert tense', true)
            }
          } catch (error) {
            showStatus(`Tense conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`, true)
          }
        }
      },
      {
        id: 'rephrase',
        label: 'Rephrase',
        description: 'Rewrite in different words',
        category: 'EDITING',
        icon: Type,
        handler: async (selectedText) => {
          showStatus('Rephrasing text...')
          try {
            const result = await callAIEndpoint('rephrase', {
              text: selectedText.text,
              tone: 'professional',
              preserveMeaning: true,
              targetLength: 'same'
            })
            
            if (result.success && result.rephrasedText) {
              if (replaceSelectedText(result.rephrasedText)) {
                showStatus('Text rephrased successfully')
              } else {
                showStatus('Rephrase generated but failed to replace text', true)
              }
            } else {
              showStatus('Failed to rephrase text', true)
            }
          } catch (error) {
            showStatus(`Rephrasing failed: ${error instanceof Error ? error.message : 'Unknown error'}`, true)
          }
        }
      },
      {
        id: 'reduce-word-count',
        label: 'Reduce Word Count',
        description: 'Make text more concise',
        category: 'EDITING',
        icon: Scissors,
        handler: async (selectedText) => {
          showStatus('Reducing word count...')
          try {
            const result = await callAIEndpoint('word-reduction', {
              text: selectedText.text,
              reductionType: 'word_count',
              targetReduction: 'moderate',
              preservePriority: 'meaning'
            })
            
            if (result.success && result.reducedText) {
              if (replaceSelectedText(result.reducedText)) {
                showStatus(`Word count reduced by ${result.reductionStats?.reductionPercentage || 0}%`)
              } else {
                showStatus('Word reduction generated but failed to replace text', true)
              }
            } else {
              showStatus('Failed to reduce word count', true)
            }
          } catch (error) {
            showStatus(`Word reduction failed: ${error instanceof Error ? error.message : 'Unknown error'}`, true)
          }
        }
      },

      // INPUTS Actions (placeholders for now)
      {
        id: 'incorporate',
        label: 'Incorporate',
        description: 'Merge with existing content',
        category: 'INPUTS',
        icon: PlusCircle,
        handler: (_selectedText) => {
          showStatus('Incorporate feature coming soon')
        }
      },
      {
        id: 'we-will',
        label: 'We Will',
        description: 'Convert to commitment language',
        category: 'INPUTS', 
        icon: Volume2,
        handler: (_selectedText) => {
          showStatus('We Will feature coming soon')
        }
      },
      {
        id: 'translate',
        label: 'Translate',
        description: 'Translate to other languages',
        category: 'INPUTS',
        icon: Languages,
        handler: (_selectedText) => {
          showStatus('Translation feature coming soon')
        }
      },

      // CUSTOM Actions (placeholders for now)
      {
        id: 'caredraft-tone',
        label: 'CareDraft Tone of Voice',
        description: 'Apply CareDraft brand tone',
        category: 'CUSTOM',
        icon: Volume2,
        handler: (_selectedText) => {
          showStatus('CareDraft tone feature coming soon')
        }
      },
      {
        id: 'replace-banned-words',
        label: 'Replace Banned Words',
        description: 'Remove inappropriate terms',
        category: 'CUSTOM',
        icon: CheckCircle2,
        handler: (_selectedText) => {
          showStatus('Banned word replacement coming soon')
        }
      },

      // OTHER Actions (placeholders for now)
      {
        id: 'pure-completion',
        label: 'Pure Completion',
        description: 'Complete the thought',
        category: 'OTHER',
        icon: Lightbulb,
        handler: (_selectedText) => {
          showStatus('Pure completion feature coming soon')
        }
      },
      {
        id: 'search',
        label: 'Search',
        description: 'Search for related content',
        category: 'OTHER',
        icon: Search,
        handler: (_selectedText) => {
          showStatus('Search feature coming soon')
        }
      }
    ]

    // Register all actions
    actions.forEach(action => {
      registerAction(action)
    })

    // Cleanup function
    return () => {
      actions.forEach(action => {
        unregisterAction(action.id)
      })
    }
  }, [registerAction, unregisterAction])
}

export default useDefaultContextActions 