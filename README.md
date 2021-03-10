# Offset bezier visualisation

This is meant to easily show how a simple approximation for the offset bezier has its limitation 
and how other approaches diverge from this approximation.

[visualisation](https://feirell.github.io/offset-bezier/)

## What this is

The goal is to find a Beziér curve which is offset from another, original, beziér curve, so the distance between those curves is always the same or, if this would result in an overlap, greater for the same argument t.

As is discussed in [this](https://math.stackexchange.com/q/302076/898405) or [this](https://math.stackexchange.com/q/465782/898405) Mathematics-Stackexchange questions, there is no correct solution but only approximations.

This visualisation demonstrates two approaches:

1. B_offset(t) = B(t) + R_rot_90_deg * B'(t) * (distance / |B'(t)|)
   It is just the normal vector stretched to the desired length, rotated to either the left or the right side by 90° added to the vector resulting from the original Beziér.  
   This approach is illustrated by the graphs left and right to the original, centered, graph.
   
2. The second approach is simpler, one just moves the control points in such a way that their connecting lines are parallel to the original connection between the control points and that those lines have the desired distance.
   Have a look at [this graph](https://math.stackexchange.com/a/467038/898405) for a better visualisation
   This approach is illustrated by the pink graphs, in the vicinity of the graphs of the first approach. 

