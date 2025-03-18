import express from 'express';
import supabase from '../../db/index.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// Register new manufacturer
router.post('/register', async (req, res) => {
    const { company_name, email, password } = req.body;
    try {
        const password_hash = await bcrypt.hash(password, 10);
        const { data, error } = await supabase
            .from('manufacturers')
            .insert([
                { company_name, email, password_hash }
            ])
            .select('id, company_name, email')
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get manufacturer's retailers
router.get('/:id/retailers', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('retailers')
            .select('*')
            .eq('manufacturer_id', req.params.id)
            .order('business_name');

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/', async (req, res) => {
  try {
    const { company_name, clerk_id } = req.body

    // Check for existing manufacturer
    const { data: existing, error: lookupError } = await supabase
      .from('manufacturers')
      .select('id')
      .or(`company_name.eq.${company_name},clerk_id.eq.${clerk_id}`)

    if (lookupError) throw lookupError
    if (existing.length > 0) {
      return res.status(409).json({
        error: 'Manufacturer already exists',
        details: existing[0].clerk_id === clerk_id ? 
          'User already has a manufacturer profile' : 
          'Company name is already taken'
      })
    }

    // Create new manufacturer
    const { data, error } = await supabase
      .from('manufacturers')
      .insert([{
        company_name,
        clerk_id,
        email: req.user.email // Get email from auth
      }])
      .select()

    if (error) throw error
    
    res.json(data[0])
  } catch (error) {
    console.error('Manufacturer creation error:', error)
    res.status(500).json({ 
      error: error.message,
      details: error.details 
    })
  }
})

export default router; 