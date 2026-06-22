"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Sparkles, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function WordFinder() {
  const [dictionary, setDictionary] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [letters, setLetters] = useState("")
  const [minLength, setMinLength] = useState("2")
  const [results, setResults] = useState<Map<number, string[]>>(new Map())
  const [error, setError] = useState("")
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set())

  const [startsWithLetters, setStartsWithLetters] = useState("")
  const [startsWithResults, setStartsWithResults] = useState<Map<number, string[]>>(new Map())
  const [startsWithSearching, setStartsWithSearching] = useState(false)
  const [startsWithError, setStartsWithError] = useState("")
  const [startsWithExpandedGroups, setStartsWithExpandedGroups] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadDictionary()
  }, [])

  const loadDictionary = async () => {
    try {
      setLoading(true)
      const response = await fetch("https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt")
      const text = await response.text()
      const words = text
        .split("\n")
        .map((word) => word.trim().toLowerCase())
        .filter(Boolean)
      setDictionary(new Set(words))
      setLoading(false)
    } catch (err) {
      console.error("Failed to load dictionary:", err)
      setError("Failed to load dictionary. Please refresh the page.")
      setLoading(false)
    }
  }

  const canFormWord = (availableLetters: string, word: string): boolean => {
    const letterCount = new Map<string, number>()

    for (const char of availableLetters) {
      letterCount.set(char, (letterCount.get(char) || 0) + 1)
    }

    for (const char of word) {
      if (!letterCount.has(char) || letterCount.get(char) === 0) {
        return false
      }
      letterCount.set(char, letterCount.get(char)! - 1)
    }

    return true
  }

  const findWords = (inputLetters: string, minWordLength: number) => {
    const foundWords: string[] = []
    const normalizedLetters = inputLetters.toLowerCase().trim()

    for (const word of dictionary) {
      if (word.length >= minWordLength && canFormWord(normalizedLetters, word)) {
        foundWords.push(word)
      }
    }

    const grouped = new Map<number, string[]>()
    for (const word of foundWords) {
      if (!grouped.has(word.length)) {
        grouped.set(word.length, [])
      }
      grouped.get(word.length)!.push(word)
    }

    for (const [length, words] of grouped) {
      grouped.set(length, words.sort())
    }

    return new Map([...grouped.entries()].sort((a, b) => b[0] - a[0]))
  }

  const handleSearch = () => {
    if (!letters.trim()) {
      setError("Please enter some letters")
      return
    }

    setError("")
    setSearching(true)

    setTimeout(() => {
      const minLen = Number.parseInt(minLength) || 2
      const foundWords = findWords(letters, minLen)
      setResults(foundWords)
      setSearching(false)
    }, 300)
  }

  const getTotalWords = () => {
    let total = 0
    for (const words of results.values()) {
      total += words.length
    }
    return total
  }

  const toggleExpanded = (length: number) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(length)) {
        newSet.delete(length)
      } else {
        newSet.add(length)
      }
      return newSet
    })
  }

  const findWordsStartingWith = (prefix: string) => {
    const foundWords: string[] = []
    const normalizedPrefix = prefix.toLowerCase().trim()

    for (const word of dictionary) {
      if (word.startsWith(normalizedPrefix)) {
        foundWords.push(word)
      }
    }

    const grouped = new Map<number, string[]>()
    for (const word of foundWords) {
      if (!grouped.has(word.length)) {
        grouped.set(word.length, [])
      }
      grouped.get(word.length)!.push(word)
    }

    for (const [length, words] of grouped) {
      grouped.set(length, words.sort())
    }

    return new Map([...grouped.entries()].sort((a, b) => b[0] - a[0]))
  }

  const handleStartsWithSearch = () => {
    if (!startsWithLetters.trim() || startsWithLetters.trim().length > 3) {
      setStartsWithError("Please enter 1 to 3 letters")
      return
    }

    setStartsWithError("")
    setStartsWithSearching(true)

    setTimeout(() => {
      const foundWords = findWordsStartingWith(startsWithLetters)
      setStartsWithResults(foundWords)
      setStartsWithSearching(false)
    }, 300)
  }

  const getStartsWithTotalWords = () => {
    let total = 0
    for (const words of startsWithResults.values()) {
      total += words.length
    }
    return total
  }

  const toggleStartsWithExpanded = (length: number) => {
    setStartsWithExpandedGroups((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(length)) {
        newSet.delete(length)
      } else {
        newSet.add(length)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Loading Dictionary</h2>
            <p className="text-muted-foreground">Preparing word database...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 md:py-12">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            <span>{dictionary.size.toLocaleString()} words loaded</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">Word Finder</h1>
          <p className="text-lg md:text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
            Discover all possible words from your letters. Perfect for word games, puzzles, and expanding your
            vocabulary.
          </p>
        </div>

        <Tabs defaultValue="anagrams" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 h-auto p-1 bg-muted/50 rounded-xl">
            <TabsTrigger value="anagrams" className="text-base py-3 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">Form Words</TabsTrigger>
            <TabsTrigger value="starts-with" className="text-base py-3 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">Starts With</TabsTrigger>
          </TabsList>
          
          <TabsContent value="anagrams" className="space-y-8">
            {/* Search Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Enter Your Letters</CardTitle>
            <CardDescription>Type any combination of letters to find all possible words</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="letters">Letters</Label>
              <Input
                id="letters"
                placeholder="e.g., example"
                value={letters}
                onChange={(e) => setLetters(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="text-lg h-14 px-4 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary/50"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minLength">Minimum Word Length</Label>
              <Input
                id="minLength"
                type="number"
                min="1"
                placeholder="2"
                value={minLength}
                onChange={(e) => setMinLength(e.target.value)}
                className="h-14 px-4 text-lg transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary/50"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleSearch}
              disabled={searching || !letters.trim()}
              className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-[1.01] shadow-lg hover:shadow-primary/25 active:scale-[0.99]"
              size="lg"
            >
              {searching ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Find Words
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {results.size > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                Found {getTotalWords()} word{getTotalWords() !== 1 ? "s" : ""}
              </h2>
              <Badge variant="secondary" className="text-base px-4 py-2">
                {results.size} length{results.size !== 1 ? "s" : ""}
              </Badge>
            </div>

            <div className="grid gap-6">
              {Array.from(results.entries()).map(([length, words]) => {
                const isExpanded = expandedGroups.has(length)
                const displayWords = isExpanded ? words : words.slice(0, 50)
                const hasMore = words.length > 50

                return (
                  <Card key={length}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{length}-Letter Words</CardTitle>
                        <Badge variant="outline">{words.length} found</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {displayWords.map((word) => (
                          <Badge key={word} variant="secondary" className="text-sm px-3 py-1.5 font-mono">
                            {word}
                          </Badge>
                        ))}
                      </div>
                      {hasMore && (
                        <Button variant="outline" size="sm" onClick={() => toggleExpanded(length)} className="w-full py-4 transition-all duration-300 hover:bg-secondary">
                          {isExpanded ? (
                            <>
                              <ChevronUp className="mr-2 h-4 w-4" />
                              Show Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="mr-2 h-4 w-4" />
                              Show All {words.length} Words
                            </>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {results.size === 0 && letters && !searching && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No words found</h3>
              <p className="text-muted-foreground">Try different letters or reduce the minimum word length</p>
            </CardContent>
          </Card>
        )}
          </TabsContent>

          <TabsContent value="starts-with" className="space-y-8">
            {/* Starts With Card */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Starts With</CardTitle>
                <CardDescription>Enter 1 to 3 letters to find words that begin with them</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="startsWithLetters">Prefix Letters (1-3 chars)</Label>
                  <Input
                    id="startsWithLetters"
                    placeholder="e.g., pre"
                    value={startsWithLetters}
                    maxLength={3}
                    onChange={(e) => setStartsWithLetters(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleStartsWithSearch()}
                    className="text-lg h-14 px-4 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary/50"
                  />
                </div>

                {startsWithError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{startsWithError}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleStartsWithSearch}
                  disabled={startsWithSearching || !startsWithLetters.trim() || startsWithLetters.trim().length > 3}
                  className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-[1.01] shadow-lg hover:shadow-primary/25 active:scale-[0.99]"
                  size="lg"
                >
                  {startsWithSearching ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-5 w-5" />
                      Find Words
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Starts With Results */}
            {startsWithResults.size > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">
                    Found {getStartsWithTotalWords()} word{getStartsWithTotalWords() !== 1 ? "s" : ""}
                  </h2>
                  <Badge variant="secondary" className="text-base px-4 py-2">
                    {startsWithResults.size} length{startsWithResults.size !== 1 ? "s" : ""}
                  </Badge>
                </div>

                <div className="grid gap-6">
                  {Array.from(startsWithResults.entries()).map(([length, words]) => {
                    const isExpanded = startsWithExpandedGroups.has(length)
                    const displayWords = isExpanded ? words : words.slice(0, 50)
                    const hasMore = words.length > 50

                    return (
                      <Card key={length}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle>{length}-Letter Words</CardTitle>
                            <Badge variant="outline">{words.length} found</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {displayWords.map((word) => (
                              <Badge key={word} variant="secondary" className="text-sm px-3 py-1.5 font-mono">
                                {word}
                              </Badge>
                            ))}
                          </div>
                          {hasMore && (
                            <Button variant="outline" size="sm" onClick={() => toggleStartsWithExpanded(length)} className="w-full py-4 transition-all duration-300 hover:bg-secondary">
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="mr-2 h-4 w-4" />
                                  Show Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="mr-2 h-4 w-4" />
                                  Show All {words.length} Words
                                </>
                              )}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {startsWithResults.size === 0 && startsWithLetters && !startsWithSearching && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No words found</h3>
                  <p className="text-muted-foreground">Try a different prefix</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

      </div>
    </div>
  )
}
