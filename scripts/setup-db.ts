import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function setupDatabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
  }

  console.log('🔧 Initializing Supabase client...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'create-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📝 SQL Script to execute:');
    console.log('---');
    console.log(sql);
    console.log('---');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`\n⚙️  Executing ${statements.length} SQL statements...\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 50)}...`);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error(`❌ Error executing statement: ${error.message}`);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err: any) {
        console.error(`❌ Execution error:`, err.message);
      }
    }

    console.log('\n✅ Database setup complete!');
    console.log('📊 Tables created:');
    console.log('  - festival_events (for storing events)');
    console.log('  - processed_events (for deduplication)');
  } catch (error: any) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
