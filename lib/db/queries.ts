import { createServerSupabase } from './supabase'
import { Ticket, Message } from '@/types/database'

export function getTickets(userId: string) {
  const supabase = createServerSupabase()
  
  return supabase
    .from('support_tickets')
    .select('*')
    .eq('assigned_to', userId)
    .order('created_at', { ascending: false })
    .then(({ data, error }) => {
      if (error) throw error
      return data as Ticket[]
    })
}

export function getTicketById(ticketId: string) {
  const supabase = createServerSupabase()
  
  return supabase
    .from('support_tickets')
    .select('*')
    .eq('id', ticketId)
    .single()
    .then(({ data, error }) => {
      if (error) throw error
      return data as Ticket
    })
}

export function getTicketMessages(ticketId: string) {
  const supabase = createServerSupabase()
  
  return supabase
    .from('support_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })
    .then(({ data, error }) => {
      if (error) throw error
      return data as Message[]
    })
}

