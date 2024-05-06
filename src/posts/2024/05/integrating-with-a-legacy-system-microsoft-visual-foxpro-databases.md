---
title: "Integrating with a Legacy System: Microsoft Visual FoxPro Databases"
date: 2024-05-06
tags: ["post","Go","Legacy Systems","Microsoft Visual FoxPro"]
description: "In a recent project, I was tasked with establishing a connection to a legacy system utilizing a Microsoft Visual FoxPro database. The goal was to create a read-only method to extract data from this s…"
thumbnail: "/images/posts/6e966352-integrating-with-a-legacy-system-microsoft-visual-foxpro-databases-thumbnail.png"
---

## The Challenge


In a recent project, I was tasked with establishing a connection to a legacy system utilizing a Microsoft Visual FoxPro database. The goal was to create a read-only method to extract data from this system into a new one.


The project was developed in Go, so my initial step was to find a suitable Go package. My search led me to [go-dbase](https://github.com/Valentin-Kaiser/go-dbase), which seemed to fit the bill perfectly.


However, upon testing the package, I encountered an unexpected hurdle. The package was throwing errors when attempting to gain read & write access to the database files. This was a problem because the project requirements specified that the access should be read-only, and the project’s environment only had read-only access to the database files.


## The Solution


Given that the project’s requirement was solely to retrieve data from the database, read-only access to the files should have been sufficient. This led me to delve into the package code to identify where write access was being requested - one of the many benefits of open-source software. I quickly found the answer and implemented a read-only mode for further testing. After successful testing, I submitted [Pull Request #62](https://github.com/Valentin-Kaiser/go-dbase/pull/62) to the original project, hoping it might be useful to others.


## The Code


If you’re facing a similar challenge, the following code demonstrates how to use the new read-only mode to read a database:


```go
package main

import (
    "encoding/json"
    "fmt"
    "github.com/Valentin-Kaiser/go-dbase/dbase"
)

func main() {
    // Open the database
    db, err := dbase.OpenDatabase(&dbase.Config{
        Filename:                          "./PATHTODATABASE/EXAMPLEDATABASE.DBC",
        TrimSpaces:                        true,
        ReadOnly:                          true,
        DisableConvertFilenameUnderscores: true,
    })
    if err != nil {
        panic(err)
    }
    // Defer the close and handle any errors
    defer func() {
        if cerr := db.Close(); err == nil {
            err = cerr
        }
    }()
    if err != nil {
        panic(err)
    }

    // Output tables info
    fmt.Printf("Tables:\n%v\n\n", db.Names())

    // Get a specific table
    tables := db.Tables()
    table := tables["EXAMPLETABLE"]

    // Output table info
    fmt.Printf(
        "Table info:\nName: %s Last modified: %v Column count: %v Record count: %v File size: %v\n\n",
        table.TableName(),
        table.Header().Modified(0),
        table.Header().ColumnsCount(),
        table.Header().RecordsCount(),
        table.Header().FileSize(),
    )

    // Output table column info
    fmt.Println("Table columns:")
    for _, column := range table.Columns() {
        fmt.Printf("Name: %v - Type: %v\n", column.Name(), column.Type())
    }

    // Get table rows
    fmt.Println("\nTable rows:")
    rows, err := table.Rows(true, true)
    if err != nil {
        panic(err)
    }
    for _, row := range rows {
        // Skip deleted rows
        if row.Deleted {
            continue
        }

        // Convert row to a map
        rowMap, err := row.ToMap()
        if err != nil {
            panic(err)
        }

        // Output row map
        s, _ := json.MarshalIndent(rowMap, "", "  ")
        fmt.Printf("Row: %s\n\n", s)
    }
}
```


## References


[https://github.com/Valentin-Kaiser/go-dbase](https://github.com/Valentin-Kaiser/go-dbase)

