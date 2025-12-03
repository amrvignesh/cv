# Migration Plan: Flask to Next.js API Routes

## Why Migrate?
- **Single deployment**: One container instead of two
- **Better performance**: No cross-service calls
- **Simpler scaling**: One service to manage
- **Unified tech stack**: All JavaScript/TypeScript

## Migration Steps:

### 1. Create API Routes Structure
```
frontend/src/app/api/
├── health/route.ts
├── assignment1/
│   └── route.ts
├── assignment2/
│   └── route.ts
└── ...
```

### 2. Convert Flask Endpoints to Next.js API Routes

**Flask (Python):**
```python
@bp.route('/process', methods=['POST'])
def process():
    # Flask logic here
    return jsonify(result)
```

**Next.js API Route (TypeScript):**
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // Convert Python CV logic to JavaScript/TypeScript
        // Use libraries like opencv-wasm, tensorflow.js, etc.
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
```

### 3. Replace Python Libraries
- **OpenCV**: Use `opencv-wasm` or `@techstark/opencv-js`
- **NumPy**: Use `mathjs` or plain JavaScript math
- **PIL/Pillow**: Use `canvas` or `sharp`

### 4. Update Frontend Calls
No changes needed - same API endpoints, just different backend.

## Pros & Cons

### ✅ Pros
- Single container deployment
- Better cold start performance
- Easier scaling
- Unified codebase

### ❌ Cons
- Need to rewrite ~200+ lines of Python CV code
- JavaScript CV libraries less mature than Python
- Larger bundle size
- Potential performance differences

## Recommendation
For quick deployment: Use **Option 2 (Multi-Service)** above.
For long-term: Consider this migration if you want a simpler architecture.
