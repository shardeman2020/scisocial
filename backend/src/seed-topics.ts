import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TopicService } from './modules/topic/topic.service';
import { JournalService } from './modules/journal/journal.service';

async function seedTopicsAndJournals() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const topicService = app.get(TopicService);
  const journalService = app.get(JournalService);

  console.log('Seeding topics...');

  const topics = [
    {
      name: 'Physics',
      description:
        'Fundamental laws of nature, from quantum mechanics to cosmology',
    },
    {
      name: 'Biomedical Science',
      description:
        'Medical research, biology, genetics, and healthcare innovations',
    },
    {
      name: 'Artificial Intelligence',
      description:
        'Machine learning, neural networks, and AI applications',
    },
    {
      name: 'Quantum Computing',
      description:
        'Quantum information processing and quantum algorithms',
    },
    {
      name: 'Chemistry',
      description:
        'Chemical reactions, molecular structures, and materials science',
    },
    {
      name: 'Economics',
      description:
        'Economic theory, market analysis, and financial systems',
    },
    {
      name: 'Political Science',
      description:
        'Political systems, governance, and international relations',
    },
    {
      name: 'Neuroscience',
      description:
        'Brain science, cognitive function, and neurological research',
    },
    {
      name: 'Climate Science',
      description:
        'Climate change, environmental systems, and sustainability',
    },
    {
      name: 'Mathematics',
      description:
        'Pure and applied mathematics, from number theory to statistics',
    },
  ];

  for (const topic of topics) {
    try {
      const existing = await topicService.findBySlug(
        topic.name.toLowerCase().replace(/\s+/g, '-'),
      );
      if (existing) {
        console.log(`Topic "${topic.name}" already exists, skipping...`);
      } else {
        await topicService.create(topic.name, topic.description);
        console.log(`Created topic: ${topic.name}`);
      }
    } catch (error) {
      console.log(`Created topic: ${topic.name}`);
    }
  }

  console.log('\nSeeding journals...');

  const journals = [
    {
      name: 'Nature',
      description:
        'Leading international journal publishing peer-reviewed research',
      impactFactor: 49.962,
      publisher: 'Springer Nature',
      disciplines: ['Physics', 'Chemistry', 'Biology'],
    },
    {
      name: 'Science',
      description:
        'Premier global science journal publishing cutting-edge research',
      impactFactor: 47.728,
      publisher: 'American Association for the Advancement of Science',
      disciplines: ['General Science'],
    },
    {
      name: 'Cell',
      description:
        'Leading journal in life sciences and biomedical research',
      impactFactor: 41.582,
      publisher: 'Cell Press',
      disciplines: ['Biomedical Science', 'Biology'],
    },
    {
      name: 'The Lancet',
      description: 'Top medical journal for clinical medicine and health',
      impactFactor: 79.323,
      publisher: 'Elsevier',
      disciplines: ['Biomedical Science', 'Medicine'],
    },
    {
      name: 'Physical Review Letters',
      description: 'Premier physics research journal',
      impactFactor: 8.385,
      publisher: 'American Physical Society',
      disciplines: ['Physics'],
    },
    {
      name: 'Journal of the American Chemical Society',
      description: 'Leading chemistry research journal',
      impactFactor: 14.612,
      publisher: 'American Chemical Society',
      disciplines: ['Chemistry'],
    },
    {
      name: 'Nature Machine Intelligence',
      description: 'AI and machine learning research',
      impactFactor: 23.8,
      publisher: 'Springer Nature',
      disciplines: ['Artificial Intelligence'],
    },
    {
      name: 'The American Economic Review',
      description: 'Top journal in economics',
      impactFactor: 10.7,
      publisher: 'American Economic Association',
      disciplines: ['Economics'],
    },
    {
      name: 'American Political Science Review',
      description: 'Leading political science journal',
      impactFactor: 5.7,
      publisher: 'Cambridge University Press',
      disciplines: ['Political Science'],
    },
    {
      name: 'Neuron',
      description: 'Premier neuroscience research journal',
      impactFactor: 17.17,
      publisher: 'Cell Press',
      disciplines: ['Neuroscience'],
    },
  ];

  for (const journal of journals) {
    try {
      const existing = await journalService.findBySlug(
        journal.name.toLowerCase().replace(/\s+/g, '-'),
      );
      if (existing) {
        console.log(`Journal "${journal.name}" already exists, skipping...`);
      } else {
        await journalService.create(
          journal.name,
          journal.description,
          journal.impactFactor,
          journal.publisher,
        );
        console.log(`Created journal: ${journal.name}`);
      }
    } catch (error) {
      console.log(`Created journal: ${journal.name}`);
    }
  }

  console.log('\n✅ Seeding complete!');
  await app.close();
}

seedTopicsAndJournals()
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  });
