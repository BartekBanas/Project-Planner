﻿namespace ProjectPlanner.Business.CriticalPathMethod;

public class CpmActivity
{
    public int? Id { get; set; }
    public string TaskName { get; set; }
    public int Duration { get; set; }
    public int[] Sequence { get; set; }
    public bool? Critical { get; set; }
    
    public CpmActivity(string taskName, int duration, int[] sequence)
    {
        TaskName = taskName;
        Duration = duration;
        Sequence = sequence;
    }
}