# WebChat Context Separation - Summary

**Date:** January 15, 2026  
**Status:** ✅ Complete Separation Implemented

---

## 🎯 **How Separation Works**

### **1. Metadata-Based Identification**

| WebChat Type | Metadata Source | Context Assignment |
|-------------|----------------|-------------------|
| **Sales WebChat** (Marketing Website) | `source: 'marketing_website'` | → **Sales Context** |
| **CS WebChat** (Customer Portal) | `source: 'webchat'` | → **CS Context** |

### **2. Explicit Context Assignment**

#### **Sales WebChat:**
```typescript
// In sales-webchat-service.ts
metadata: {
  source: 'marketing_website',  // ← Identifies as sales
  is_prospect: true,
}

// Explicitly assigns to Sales context
await UnifiedInboxService.assignToContext(
  conversationId,
  salesContextId,
  'sales',  // ← Sales team
  5         // ← High priority
)
```

#### **CS WebChat:**
```typescript
// In unified-webchat-service.ts
metadata: {
  source: 'webchat',  // ← Identifies as CS
  created_via: 'customer_portal',
}

// Explicitly assigns to CS context
await UnifiedInboxService.autoAssignContext(
  conversationId,
  tenantId
)  // ← Always assigns to CS context
```

### **3. Database Separation**

Both conversations stored in same `cs_conversations` table, but:

- **Separate context assignments** in `unified_conversation_contexts`
- **Different `context_type`**: `'sales'` vs `'cs'`
- **Different `assigned_team`**: `'sales'` vs `'cs'`

### **4. UI Filtering**

```tsx
// UnifiedInboxList component
<ContextSwitcher>
  <Button onClick={() => setContext('sales')}>Sales</Button>
  <Button onClick={() => setContext('cs')}>CS</Button>
</ContextSwitcher>

// Only shows conversations for selected context
<ConversationList context={activeContext} />
```

---

## ✅ **Separation Guarantees**

1. ✅ **Metadata distinguishes** source (marketing_website vs webchat)
2. ✅ **Explicit assignment** to correct context (sales vs cs)
3. ✅ **Database constraints** prevent invalid context types
4. ✅ **UI filtering** shows only relevant context
5. ✅ **No mixing** - complete separation at all layers

---

## 🔍 **Verification**

To verify separation:

1. **Create sales chat** → Check `metadata->>'source'` = `'marketing_website'`
2. **Check context** → Should be `context_type = 'sales'`
3. **Create CS chat** → Check `metadata->>'source'` = `'webchat'`
4. **Check context** → Should be `context_type = 'cs'`
5. **View Sales inbox** → Only sales conversations appear
6. **View CS inbox** → Only CS conversations appear

---

**Result:** Complete separation - Sales and CS webchats never mix.
