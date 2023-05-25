﻿namespace ProjectPlanner.Business.TransportationProblem;

public class TpProject
{
    private TpTask _task;

    public float[,] TransportationTable { get; set; }
    
    private float[,] _profitTable;
    
    public TpProject(TpTask task)
    {
        _task = task;
        InitializeTpProject();
    }

    public TpSolution CreateSolution()
    {
        var JaggedTransportationTable = ConvertToJaggedArray(TransportationTable);
        
        return new TpSolution(0, 0, 0, JaggedTransportationTable);
    }

    private void InitializeTpProject()
    {
        int totalSupply = _task.Suppliers.Sum(supplier => supplier.Supply);
        int totalDemand = _task.Recipients.Sum(recipient => recipient.Demand);

        if (totalSupply > totalDemand)
        {
            _task.Recipients.Add(new Recipient(totalSupply - totalDemand, 0));
        }
        if (totalSupply < totalDemand)
        {
            _task.Suppliers.Add(new Supplier(totalSupply - totalDemand, 0));
        }

        InitializeProfitTable();
        InitializeTransportationTable();
    }

    private void InitializeProfitTable()
    {
        _profitTable = new float[_task.Suppliers.Count, _task.Recipients.Count];

        int transportationCostsArrayLenght = _task.TransportCost.Length;
        int transportationCostsArrayWidth = _task.TransportCost[0].Length;
        
        for (int i = 0; i < _task.Suppliers.Count; i++)
        {
            for (int j = 0; j < _task.Recipients.Count; j++)
            {
                //Profit equals to selling cost to recipients - buying cost from suppliers
                _profitTable[i, j] = _task.Recipients[j].Cost - _task.Suppliers[i].Cost;
            }
        }

        for (int i = 0; i < transportationCostsArrayLenght; i++)
        {
            for (int j = 0; j < transportationCostsArrayWidth; j++)
            {
                _profitTable[i, j] -= _task.TransportCost[i][j];
            }
        }
    }

    private void InitializeTransportationTable()
    {
        TransportationTable = new float[_task.Suppliers.Count, _task.Recipients.Count];

        int[] supplyToDistribute = new int[_task.Suppliers.Count];
        int[] demandToDistribute = new int[_task.Recipients.Count];

        for (int i = 0; i < _task.Suppliers.Count; i++)
        {
            supplyToDistribute[i] = _task.Suppliers[i].Supply;
        }
        
        for (int i = 0; i < _task.Recipients.Count; i++)
        {
            demandToDistribute[i] = _task.Recipients[i].Demand;
        }
        
        IOrderedEnumerable<(int, int)> sortedIndicesArray = CreateSortedIndicesArray(_profitTable);

        foreach (var indexes in sortedIndicesArray)
        {
            int supplierId = indexes.Item1;
            int recipientId = indexes.Item2;
            
            int amountOfCargo = Math.Min(supplyToDistribute[supplierId], demandToDistribute[recipientId]);

            // Przypisz wartość z _profitTable do TransportationTable
            TransportationTable[supplierId, recipientId] = amountOfCargo;

            // Zaktualizuj dostępność dostaw i zapotrzebowania
            supplyToDistribute[supplierId] -= amountOfCargo;
            demandToDistribute[recipientId] -= amountOfCargo;
        }
    }
    
    private IOrderedEnumerable<(int, int)> CreateSortedIndicesArray(float[,] array)
    {
        // Tworzenie tablicy par indeksów
        (int, int)[] indexPairs = new (int, int)[array.Length];
        int index = 0;

        // Przechodzenie przez wszystkie indeksy tablicy _profitTable i przypisanie ich do tablicy par indeksów
        for (int i = 0; i < array.GetLength(0); i++)
        {
            for (int j = 0; j < array.GetLength(1); j++)
            {
                indexPairs[index] = (i, j);
                index++;
            }
        }

        // Sortowanie tablicy par indeksów według wartości elementów w tablicy _profitTable w kolejności malejącej
        var sortedIndexPairs = indexPairs.OrderByDescending(pair => array[pair.Item1, pair.Item2]);


        return sortedIndexPairs;
    }
    
    public static float[][] ConvertToJaggedArray(float[,] array)
    {
        int rows = array.GetLength(0);
        int columns = array.GetLength(1);

        float[][] jaggedArray = new float[rows][];

        for (int i = 0; i < rows; i++)
        {
            jaggedArray[i] = new float[columns];

            for (int j = 0; j < columns; j++)
            {
                jaggedArray[i][j] = array[i, j];
            }
        }

        return jaggedArray;
    }
}