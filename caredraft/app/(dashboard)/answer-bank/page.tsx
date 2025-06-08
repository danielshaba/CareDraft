import { Metadata } from 'next'
import { AnswerBankManagementInterface } from '@/components/answer-bank/AnswerBankManagementInterface'

export const metadata: Metadata = {
  title: 'Answer Bank Management | CareDraft',
  description: 'Manage your reusable content library with categorization and search',
}

export default function AnswerBankPage() {
  return <AnswerBankManagementInterface />
} 