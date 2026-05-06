import { useState } from "react";
import { Button } from "../ui/button";

export function PropertyEditDrawer({ property, onSave }: any) {
    const [form, setForm] = useState(property);
  
    return (
      <div className="p-4 space-y-4">
        <h2 className="text-xl font-bold">Edit Property</h2>
  
        <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
        <input value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
  
        <Button onClick={() => onSave(form)}>Save</Button>
      </div>
    );
  }
  