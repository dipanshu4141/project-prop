export function PropertyOverview({ property }: { property: any }) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <div className="font-medium mb-3">Overview</div>
  
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground">Price</div>
            <div>₹ {property.price}</div>
          </div>
  
          <div>
            <div className="text-muted-foreground">Type</div>
            <div>
              {property.bhk
                ? `${property.bhk} ${property.propertySubType}`
                : property.propertySubType}
            </div>
          </div>
  
          <div>
            <div className="text-muted-foreground">Area</div>
            <div>{property.area || "—"}</div>
          </div>
  
          <div>
            <div className="text-muted-foreground">City</div>
            <div>{property.city || "—"}</div>
          </div>
  
          <div>
            <div className="text-muted-foreground">Furnishing</div>
            <div>{property.furnishing || "—"}</div>
          </div>
  
          <div>
            <div className="text-muted-foreground">Status</div>
            <div>{property.status}</div>
          </div>
        </div>
      </div>
    );
  }
  