import { createServerSupabase } from './supabase'
import { Ticket, Message } from '@/libs/types/database'

export async function getTickets(userId: string) {
  const supabase = await createServerSupabase()
  
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('assigned_to', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as Ticket[]
}

export async function getTicketById(ticketId: string) {
  const supabase = await createServerSupabase()
  
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('id', ticketId)
    .single()
  
  if (error) throw error
  return data as Ticket
}

export async function getTicketMessages(ticketId: string) {
  const supabase = await createServerSupabase()
  
  const { data, error } = await supabase
    .from('support_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data as Message[]
}

