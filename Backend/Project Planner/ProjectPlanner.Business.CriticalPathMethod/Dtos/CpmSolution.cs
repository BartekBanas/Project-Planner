﻿namespace ProjectPlanner.Business.CriticalPathMethod.Dtos;

public class CpmSolution
{
    public List<CpmActivity> Activities { get; set; } = null!;

    public int CriticalTime { get; set; }
}