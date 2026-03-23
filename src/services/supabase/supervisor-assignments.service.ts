import { supabase } from './client';

export interface SupervisorAssignment {
    id: string;
    supervisor_id: string;
    assignment_type: 'class' | 'subject' | 'all';
    assignment_value: string | null;
    user?: {
        id: string;
        email: string;
        name: string;
    };
}

export const supervisorAssignmentsService = {
    async getAssignments() {
        const { data, error } = await supabase
            .from('supervisor_assignments')
            .select(`
                *,
                user:users!supervisor_id(id, email, name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as SupervisorAssignment[];
    },

    async getSupervisors() {
        const { data, error } = await supabase
            .from('users')
            .select('id, email, name')
            .eq('role', 'supervisor');

        if (error) throw error;
        return data;
    },

    async createAssignment(assignment: Omit<SupervisorAssignment, 'id' | 'user' | 'created_at' | 'updated_at'>) {
        const { data, error } = await supabase
            .from('supervisor_assignments')
            .insert([assignment])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteAssignment(id: string) {
        const { error } = await supabase
            .from('supervisor_assignments')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
