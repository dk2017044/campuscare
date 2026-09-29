import dotenv from 'dotenv';
dotenv.config();

/**
 * Intelligent Fallback Triage Engine
 * Always available as a reliable fail-safe if network or API limits are encountered.
 */
function fallbackTriage({ text, location, userCategory }) {
  const content = (text + ' ' + (location || '')).toLowerCase();

  // 1. Immediate Danger / Emergency keywords
  if (
    content.includes('danger') ||
    content.includes('weapon') ||
    content.includes('attack') ||
    content.includes('violence') ||
    content.includes('fire') ||
    content.includes('assault') ||
    content.includes('kill') ||
    content.includes('immediate help')
  ) {
    return {
      category: 'student_safety',
      category_label: 'Student Safety',
      subcategory: 'immediate_danger',
      subcategory_label: 'Immediate Danger / Severe Threat',
      priority_suggestion: 'CRITICAL',
      suggested_department_id: 'dept-security',
      suggested_department_name: 'Campus Security & Emergency Response',
      confidence: 0.96,
      reasoning: 'Critical danger or imminent threat detected. Immediate dispatch to Campus Security recommended.',
      location_detected: location || 'Campus Premises',
      evidence_needed: false
    };
  }

  // 2. Harassment / Stalking / Bullying
  if (
    content.includes('follow') ||
    content.includes('harass') ||
    content.includes('stalk') ||
    content.includes('threat') ||
    content.includes('bully') ||
    content.includes('intimidat') ||
    content.includes('uncomfortable') ||
    content.includes('creepy')
  ) {
    return {
      category: 'student_safety',
      category_label: 'Student Safety',
      subcategory: 'harassment',
      subcategory_label: 'Harassment / Intimidation',
      priority_suggestion: 'HIGH',
      suggested_department_id: 'dept-welfare',
      suggested_department_name: 'Student Welfare & Counseling Committee',
      confidence: 0.92,
      reasoning: 'Interpersonal harassment or stalking reported. Requires confidential student welfare support and discreet corridor monitoring.',
      location_detected: location || 'Laboratory / Corridor Area',
      evidence_needed: true
    };
  }

  // 3. Maintenance - Electrical (Fan, Light, Wiring)
  if (
    content.includes('fan') ||
    content.includes('light') ||
    content.includes('bulb') ||
    content.includes('switch') ||
    content.includes('wire') ||
    content.includes('spark') ||
    content.includes('power') ||
    content.includes('socket')
  ) {
    const isWobblingOrSpark = content.includes('spark') || content.includes('wobble') || content.includes('fall');
    return {
      category: 'maintenance',
      category_label: 'Maintenance',
      subcategory: 'electrical',
      subcategory_label: 'Electrical / Ceiling Fixture',
      priority_suggestion: isWobblingOrSpark ? 'HIGH' : 'MEDIUM',
      suggested_department_id: 'dept-electrical',
      suggested_department_name: 'Electrical & Power Maintenance',
      confidence: 0.94,
      reasoning: 'Electrical fixture issue detected. Requires technician dispatch and power safety inspection.',
      location_detected: location || 'Lecture Hall / Classroom',
      evidence_needed: true
    };
  }

  // 4. Maintenance - Plumbing / Water
  if (
    content.includes('leak') ||
    content.includes('water') ||
    content.includes('pipe') ||
    content.includes('tap') ||
    content.includes('washroom') ||
    content.includes('restroom') ||
    content.includes('overflow')
  ) {
    return {
      category: 'maintenance',
      category_label: 'Maintenance',
      subcategory: 'plumbing',
      subcategory_label: 'Plumbing / Water Leakage',
      priority_suggestion: 'HIGH',
      suggested_department_id: 'dept-plumbing',
      suggested_department_name: 'Plumbing & Water Systems',
      confidence: 0.93,
      reasoning: 'Water leakage can cause structural damage and slip hazards. High maintenance priority assigned.',
      location_detected: location || 'Sanitary / Common Area',
      evidence_needed: true
    };
  }

  // 5. Maintenance - Furniture / Cleanliness / General
  if (
    content.includes('desk') ||
    content.includes('bench') ||
    content.includes('chair') ||
    content.includes('broken door') ||
    content.includes('clean') ||
    content.includes('trash') ||
    content.includes('garbage')
  ) {
    return {
      category: 'maintenance',
      category_label: 'Maintenance',
      subcategory: 'civil_cleanliness',
      subcategory_label: 'Civil & Facilities Maintenance',
      priority_suggestion: 'MEDIUM',
      suggested_department_id: 'dept-civil',
      suggested_department_name: 'Civil & Infrastructure Maintenance',
      confidence: 0.89,
      reasoning: 'Classroom furniture or sanitation issue logged for routine facilities servicing.',
      location_detected: location || 'Campus Facility',
      evidence_needed: false
    };
  }

  // 6. Lost & Found
  if (
    content.includes('lost') ||
    content.includes('found') ||
    content.includes('calculator') ||
    content.includes('wallet') ||
    content.includes('id card') ||
    content.includes('bag') ||
    content.includes('keys') ||
    content.includes('bottle') ||
    userCategory === 'lost_found'
  ) {
    const isFound = content.includes('found');
    return {
      category: 'lost_found',
      category_label: 'Lost & Found',
      subcategory: isFound ? 'found_item' : 'lost_item',
      subcategory_label: isFound ? 'Found Item Intake' : 'Lost Property Report',
      priority_suggestion: 'LOW',
      suggested_department_id: 'dept-welfare',
      suggested_department_name: 'Student Welfare & Counseling Committee',
      confidence: 0.91,
      reasoning: 'Item property intake routed to Lost & Found matching pipeline for automated correlation.',
      location_detected: location || 'Campus Grounds',
      evidence_needed: false
    };
  }

  // Default fallback
  return {
    category: userCategory || 'other',
    category_label: 'General Campus Issue',
    subcategory: 'general_inquiry',
    subcategory_label: 'General Inquiries & Student Welfare',
    priority_suggestion: 'MEDIUM',
    suggested_department_id: 'dept-welfare',
    suggested_department_name: 'Student Welfare & Counseling Committee',
    confidence: 0.78,
    reasoning: 'Automated keyword heuristic analysis complete. Route to Student Welfare for initial assessment.',
    location_detected: location || 'Campus',
    evidence_needed: false
  };
}

/**
 * Triage text report using Gemini 3.5 Flash or fallback
 */
export async function triageReport({ text, location, when, userCategory }) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey.trim() === '') {
    return fallbackTriage({ text, location, userCategory });
  }

  try {
    const prompt = `You are the AI Triage Engine for CampusCare, an institution-grade campus safety, complaint, and maintenance platform.
Analyze the following student report and produce a strict JSON object.
Do NOT accuse individuals or determine legal guilt. AI suggestions are assistive and require human review.

Student Report:
"${text}"

Incident Location: "${location || 'Not specified'}"
Incident Time: "${when || 'Not specified'}"
User Selected Category: "${userCategory || 'Not specified'}"

Available campus departments:
- dept-security: Campus Security & Emergency Response (immediate danger, violence, theft, physical intimidation, suspicious behavior)
- dept-welfare: Student Welfare & Counseling Committee (harassment, bullying, stalking, emotional distress, lost & found)
- dept-electrical: Electrical & Power Maintenance (fans, lights, wiring, power outages, switches)
- dept-plumbing: Plumbing & Water Systems (leaks, clogged drains, restrooms, water supply)
- dept-civil: Civil & Infrastructure Maintenance (damaged desks, windows, doors, painting, cleanliness)
- dept-hostel: Hostel Administration (hostel room issues, mess, room allotment)
- dept-it-labs: IT Infrastructure & Labs (lab computers, projector, Wi-Fi, lab equipment)

Respond with ONLY valid JSON with this exact schema:
{
  "category": "student_safety" | "maintenance" | "lost_found" | "other",
  "category_label": "Student Safety" | "Maintenance" | "Lost & Found" | "General Campus Issue",
  "subcategory": string,
  "subcategory_label": string,
  "priority_suggestion": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "suggested_department_id": string,
  "suggested_department_name": string,
  "confidence": number,
  "reasoning": string,
  "location_detected": string,
  "evidence_needed": boolean
}`;

    for (const model of ['gemini-3.5-flash', 'gemini-3.5-flash-lite']) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            const parsed = JSON.parse(candidateText);
            return parsed;
          }
        }
      } catch (innerErr) {
        console.warn(`Model ${model} call failed:`, innerErr.message);
      }
    }
  } catch (error) {
    console.error('Gemini triage failed, using fallback engine:', error.message);
  }

  return fallbackTriage({ text, location, userCategory });
}

/**
 * Classify maintenance image using Gemini Multimodal Vision or smart heuristic
 */
export async function classifyMaintenanceImage({ description, fileName = '', imageBase64 = null, mimeType = 'image/jpeg' }) {
  const apiKey = process.env.GEMINI_API_KEY;

  // If real image bytes provided and API key active, run real Gemini Vision!
  if (apiKey && imageBase64) {
    try {
      const visionPrompt = `You are CampusCare Campus Maintenance AI.
Examine this photo taken on a college campus. Identify the defect or issue.
If additional context was given: "${description || 'None provided'}".

Available campus departments:
- dept-electrical: Electrical & Power Maintenance (fans, lights, wires, switches, AC)
- dept-plumbing: Plumbing & Water Systems (leaks, pipes, taps, washrooms)
- dept-civil: Civil & Infrastructure Maintenance (desks, chairs, doors, windows, paint, masonry)
- dept-it-labs: IT Infrastructure & Labs (projectors, PCs, audio/video equipment)

Respond with ONLY valid JSON with this schema:
{
  "category": "Maintenance",
  "subcategory": string,
  "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "suggestedDepartment": string,
  "departmentId": "dept-electrical" | "dept-plumbing" | "dept-civil" | "dept-it-labs",
  "detectedIssue": string,
  "confidence": number,
  "aiNotice": "AI Suggested Classification — Human Review Required"
}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType || 'image/jpeg',
                    data: imageBase64
                  }
                },
                { text: visionPrompt }
              ]
            }
          ],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          parsed.aiNotice = 'AI Suggested Classification — Human Review Required';
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Gemini Vision API error, using heuristic classifier:', e.message);
    }
  }

  // Smart Heuristic Fallback
  const combined = (description + ' ' + fileName).toLowerCase();

  if (combined.includes('fan')) {
    return {
      category: 'Maintenance',
      subcategory: 'Electrical / Ceiling Fan',
      priority: 'MEDIUM',
      suggestedDepartment: 'Electrical & Power Maintenance',
      departmentId: 'dept-electrical',
      detectedIssue: 'Ceiling fan mechanical rattling or motor defect',
      confidence: 0.94,
      aiNotice: 'AI Suggested Classification — Human Review Required'
    };
  }

  if (combined.includes('leak') || combined.includes('water') || combined.includes('pipe') || combined.includes('tap') || combined.includes('sink')) {
    return {
      category: 'Maintenance',
      subcategory: 'Plumbing / Water Leakage',
      priority: 'HIGH',
      suggestedDepartment: 'Plumbing & Water Systems',
      departmentId: 'dept-plumbing',
      detectedIssue: 'Active plumbing seepage or pipe leakage hazard',
      confidence: 0.95,
      aiNotice: 'AI Suggested Classification — Human Review Required'
    };
  }

  if (combined.includes('light') || combined.includes('bulb') || combined.includes('switch') || combined.includes('spark') || combined.includes('dark')) {
    return {
      category: 'Maintenance',
      subcategory: 'Electrical / Lighting',
      priority: 'MEDIUM',
      suggestedDepartment: 'Electrical & Power Maintenance',
      departmentId: 'dept-electrical',
      detectedIssue: 'Non-functional or short-circuit lighting fixture',
      confidence: 0.91,
      aiNotice: 'AI Suggested Classification — Human Review Required'
    };
  }

  if (combined.includes('chair') || combined.includes('bench') || combined.includes('desk') || combined.includes('table') || combined.includes('door') || combined.includes('window')) {
    return {
      category: 'Maintenance',
      subcategory: 'Civil & Carpentry',
      priority: 'LOW',
      suggestedDepartment: 'Civil & Infrastructure Maintenance',
      departmentId: 'dept-civil',
      detectedIssue: 'Damaged classroom furniture or architectural fitting',
      confidence: 0.88,
      aiNotice: 'AI Suggested Classification — Human Review Required'
    };
  }

  return {
    category: 'Maintenance',
    subcategory: 'General Facilities',
    priority: 'MEDIUM',
    suggestedDepartment: 'Civil & Infrastructure Maintenance',
    departmentId: 'dept-civil',
    detectedIssue: 'Campus physical facility defect detected',
    confidence: 0.85,
    aiNotice: 'AI Suggested Classification — Human Review Required'
  };
}

/**
 * Match Lost & Found items using semantic and attribute similarity
 */
export function matchLostAndFoundItems(newItem, existingItems) {
  const matches = [];

  const targetType = newItem.type === 'lost' ? 'found' : 'lost';
  const candidates = existingItems.filter(i => i.type === targetType);

  for (const candidate of candidates) {
    let score = 0;
    const reasons = [];

    const newItemWords = `${newItem.itemType || ''} ${newItem.title || ''} ${newItem.description || ''}`.toLowerCase();
    const candidateWords = `${candidate.itemType || ''} ${candidate.title || ''} ${candidate.description || ''}`.toLowerCase();

    // Check specific equipment keywords
    const keyTerms = ['calculator', 'casio', 'phone', 'iphone', 'samsung', 'wallet', 'id card', 'keys', 'bottle', 'laptop', 'spectacles', 'glasses', 'umbrella', 'notebook', 'bag', 'earbuds', 'airpods', 'charger'];
    for (const term of keyTerms) {
      if (newItemWords.includes(term) && candidateWords.includes(term)) {
        score += 45;
        reasons.push(`Matched item type '${term}'`);
        break;
      }
    }

    // Color match
    if (newItem.color && candidate.color && newItem.color.toLowerCase() === candidate.color.toLowerCase()) {
      score += 20;
      reasons.push(`Matching color: ${newItem.color}`);
    } else if (newItem.color && candidateWords.includes(newItem.color.toLowerCase())) {
      score += 15;
      reasons.push(`Color match found: ${newItem.color}`);
    }

    // Location match
    if (newItem.location && candidate.location) {
      const locA = newItem.location.toLowerCase();
      const locB = candidate.location.toLowerCase();
      if (locA.includes('electronics lab') && locB.includes('electronics lab')) {
        score += 25;
        reasons.push('Identical location (Electronics Lab)');
      } else if (locA === locB) {
        score += 25;
        reasons.push(`Identical location: ${newItem.location}`);
      } else {
        const wordsA = locA.split(/\s+/);
        const matchFound = wordsA.some(w => w.length > 3 && locB.includes(w));
        if (matchFound) {
          score += 15;
          reasons.push('Proximity campus zone overlap');
        }
      }
    }

    // Brand match
    if (newItem.brand && candidate.brand && newItem.brand.toLowerCase() === candidate.brand.toLowerCase()) {
      score += 10;
      reasons.push(`Matching brand: ${newItem.brand}`);
    }

    const confidence = Math.min(98, Math.max(25, score));

    if (confidence >= 55) {
      matches.push({
        candidateItem: candidate,
        confidence,
        matchReasons: reasons,
        isHighConfidence: confidence >= 80
      });
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence);
}
