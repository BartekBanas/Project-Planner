﻿namespace ProjectPlanner.Business.CriticalPathMethod;

public class CpmProject
{
    private CpmTask Task { get; }
    private List<CpmActivity> Activities { get; set; } = null!;
    private Dictionary<int, CpmEvent> EventDictionary { get; set; }
    private int StartId { get; set; }
    private int EndId { get; set; }

    public CpmProject(CpmTask cpmTask)
    {
        Task = cpmTask;
        EventDictionary = new Dictionary<int, CpmEvent>();
    }

    public CpmSolution CreateSolution()
    {
        Activities = Task.Activities;
        SetupActivities();
        SetUpEvents();
        FindStartAndEnd();
        
        CalculateEarliestTime(EventDictionary[EndId]);
        CalculateLatestTime(EventDictionary[StartId]);

        CalculateTimeReserve();
        CalculateActivitiesProperties();
        
        FindCriticalPath();
        
        var solution = new CpmSolution
        {
            Activities = Activities,
            Events = EventDictionary.Values.ToList()
        };

        return solution;
    }

    private void SetupActivities()
    {
        for (int i = 0; i < Task.Activities.Count; i++)
        {
            Task.Activities[i].Id = i;
        }
    }

    private void SetUpEvents()
    {
        HashSet<int> eventIds = new HashSet<int>();
        
        foreach (var activity in Task.Activities)
        {
            eventIds.Add(activity.Sequence[0]);
            eventIds.Add(activity.Sequence[1]);
        }
        
        foreach (var eventId in eventIds)
        {
            EventDictionary.Add(eventId, new CpmEvent(eventId));
        }
    }

    private void FindStartAndEnd()
    {
        HashSet<int> eventIds = new HashSet<int>();
        
        foreach (var activity in Task.Activities)
        {
            eventIds.Add(activity.Sequence[0]);
            eventIds.Add(activity.Sequence[1]);
        }

        foreach (var eventId in eventIds)
        {
            int predecessors = 0;
            int successors = 0;
            
            foreach (var activity in Task.Activities)
            {
                if (eventId == activity.Sequence[0])
                {
                    EventDictionary[eventId].Successors.Add(activity.Sequence[1]);
                    successors++;
                }
                if (eventId == activity.Sequence[1])
                {
                    EventDictionary[eventId].Predecessors.Add(activity.Sequence[0]);
                    predecessors++;
                }
            }

            if (predecessors == 0)
            {
                StartId = eventId;
            }

            if (successors == 0)
            {
                EndId = eventId;
            }
        }
    }

    private int CalculateEarliestTime(CpmEvent cpmEvent)
    {
        int earlyTime = 0;
            
        //foreach preceding activity
        foreach (var cpmActivity in Activities)
        {
            if(cpmActivity.Sequence[1] == cpmEvent.Id)
            {
                int predecessorStart = CalculateEarliestTime(EventDictionary[cpmActivity.Sequence[0]]);

                if (earlyTime < predecessorStart + cpmActivity.Duration)
                {
                    earlyTime = predecessorStart + cpmActivity.Duration;
                }
            }
        }

        cpmEvent.EarliestTime = earlyTime;
        
        return earlyTime;
    }

    private int CalculateLatestTime(CpmEvent cpmEvent)
    {
        int lateTime = EventDictionary[EndId].EarliestTime;
            
        //foreach preceding activity
        foreach (var activity in Activities)
        {
            if(activity.Sequence[0] == cpmEvent.Id)
            {
                int predecessorFinish = CalculateLatestTime(EventDictionary[activity.Sequence[1]]);

                if (lateTime > predecessorFinish - activity.Duration)
                {
                    lateTime = predecessorFinish - activity.Duration;
                }
            }
        }

        cpmEvent.LatestTime = lateTime;
        
        return lateTime;
    }
    
    private void CalculateTimeReserve()
    {
        foreach (var cpmEvent in EventDictionary.Values.ToList())
        {
            cpmEvent.TimeReserve = cpmEvent.LatestTime - cpmEvent.EarliestTime;
        }
    }
    
    private void FindCriticalPath()
    {
        foreach (var activity in Task.Activities)
        {
            if (activity.TimeReserve == 0)
            {
                activity.Critical = true;
            }
            else
            {
                activity.Critical = false;
            }
        }
    }

    private void CalculateActivitiesProperties()
    {
        foreach (var activity in Activities)
        {
            activity.EarlyFinish = EventDictionary[activity.Sequence[0]].EarliestTime + activity.Duration;
            activity.LateStart = EventDictionary[activity.Sequence[1]].LatestTime - activity.Duration;
            activity.EarlyStart = EventDictionary[activity.Sequence[0]].EarliestTime;
            activity.LateFinish = EventDictionary[activity.Sequence[1]].LatestTime;

            activity.TimeReserve = activity.LateFinish - activity.EarlyFinish;
        }
    }
}