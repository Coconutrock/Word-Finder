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
import { Switch } from "@/components/ui/switch"

export default function WordFinder() {
  const [dictionary, setDictionary] = useState<Set<string>>(new Set())
  const [commonDictionary, setCommonDictionary] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [letters, setLetters] = useState("")
  const [minLength, setMinLength] = useState("2")
  const [maxLength, setMaxLength] = useState("")
  const [commonOnly, setCommonOnly] = useState(true)
  const [results, setResults] = useState<Map<number, string[]>>(new Map())
  const [error, setError] = useState("")
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set())

  const [patternStartsWith, setPatternStartsWith] = useState("")
  const [patternEndsWith, setPatternEndsWith] = useState("")
  const [patternMaxLength, setPatternMaxLength] = useState("")
  const [patternCommonOnly, setPatternCommonOnly] = useState(true)
  const [patternResults, setPatternResults] = useState<Map<number, string[]>>(new Map())
  const [patternSearching, setPatternSearching] = useState(false)
  const [patternError, setPatternError] = useState("")
  const [patternExpandedGroups, setPatternExpandedGroups] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadDictionary()
  }, [])

  const loadDictionary = async () => {
    try {
      setLoading(true)
      const [response, commonResponse] = await Promise.all([
        fetch("https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt"),
        fetch("https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt")
      ])
      const text = await response.text()
      const words = text
        .split("\n")
        .map((word) => word.trim().toLowerCase())
        .filter(Boolean)
      setDictionary(new Set(words))

      const commonText = await commonResponse.text()
      const commonWords = commonText
        .split("\n")
        .map((word) => word.trim().toLowerCase())
        .filter(Boolean)
      setCommonDictionary(new Set(commonWords))

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

  const findWords = (inputLetters: string, minWordLength: number, maxLen?: number, onlyCommon?: boolean) => {
    const foundWords: string[] = []
    const normalizedLetters = inputLetters.toLowerCase().trim()

    for (const word of dictionary) {
      if (word.length >= minWordLength && (!maxLen || word.length <= maxLen) && canFormWord(normalizedLetters, word)) {
        if (!onlyCommon || commonDictionary.has(word)) {
          foundWords.push(word)
        }
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
      const maxLen = maxLength ? Number.parseInt(maxLength) : undefined
      const foundWords = findWords(letters, minLen, maxLen, commonOnly)
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

  const findWordsByPattern = (startsWith: string, endsWith: string, maxLen?: number, onlyCommon?: boolean) => {
    const foundWords: string[] = []
    const normalizedStart = startsWith.toLowerCase().trim()
    const normalizedEnd = endsWith.toLowerCase().trim()

    for (const word of dictionary) {
      const matchStart = normalizedStart ? word.startsWith(normalizedStart) : true
      const matchEnd = normalizedEnd ? word.endsWith(normalizedEnd) : true
      
      if (matchStart && matchEnd) {
        if (maxLen && word.length > maxLen) continue;
        if (!onlyCommon || commonDictionary.has(word)) {
          foundWords.push(word)
        }
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

  const handlePatternSearch = () => {
    if (!patternStartsWith.trim() && !patternEndsWith.trim()) {
      setPatternError("Please enter starts with or ends with letters")
      return
    }

    setPatternError("")
    setPatternSearching(true)

    setTimeout(() => {
      const maxLen = patternMaxLength ? Number.parseInt(patternMaxLength) : undefined
      const foundWords = findWordsByPattern(patternStartsWith, patternEndsWith, maxLen, patternCommonOnly)
      setPatternResults(foundWords)
      setPatternSearching(false)
    }, 300)
  }

  const getPatternTotalWords = () => {
    let total = 0
    for (const words of patternResults.values()) {
      total += words.length
    }
    return total
  }

  const togglePatternExpanded = (length: number) => {
    setPatternExpandedGroups((prev) => {
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
            <TabsTrigger value="pattern" className="text-base py-3 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">Starts & Ends With</TabsTrigger>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minLength">Min Length</Label>
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

              <div className="space-y-2">
                <Label htmlFor="maxLength">Max Length</Label>
                <Input
                  id="maxLength"
                  type="number"
                  min="1"
                  placeholder="Any"
                  value={maxLength}
                  onChange={(e) => setMaxLength(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="h-14 px-4 text-lg transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary/50"
                />
              </div>
            </div>

            <div className="flex items-center justify-between space-x-2 pt-4 border-t">
              <div className="space-y-0.5">
                <Label htmlFor="commonOnly" className="text-base">Common Words Only</Label>
                <p className="text-sm text-muted-foreground">Filter out obscure and rare words</p>
              </div>
              <Switch
                id="commonOnly"
                checked={commonOnly}
                onCheckedChange={setCommonOnly}
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

          <TabsContent value="pattern" className="space-y-8">
            {/* Pattern Search Card */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Starts & Ends With</CardTitle>
                <CardDescription>Find words that start and/or end with specific letters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patternStartsWith">Starts With</Label>
                    <Input
                      id="patternStartsWith"
                      placeholder="e.g., pre"
                      value={patternStartsWith}
                      onChange={(e) => setPatternStartsWith(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handlePatternSearch()}
                      className="text-lg h-14 px-4 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="patternEndsWith">Ends With</Label>
                    <Input
                      id="patternEndsWith"
                      placeholder="e.g., ing"
                      value={patternEndsWith}
                      onChange={(e) => setPatternEndsWith(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handlePatternSearch()}
                      className="text-lg h-14 px-4 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="patternMaxLength">Max Length</Label>
                    <Input
                      id="patternMaxLength"
                      type="number"
                      min="1"
                      placeholder="Any"
                      value={patternMaxLength}
                      onChange={(e) => setPatternMaxLength(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handlePatternSearch()}
                      className="h-14 px-4 text-lg transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary/50"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between space-x-2 pt-4 border-t">
                  <div className="space-y-0.5">
                    <Label htmlFor="patternCommonOnly" className="text-base">Common Words Only</Label>
                    <p className="text-sm text-muted-foreground">Filter out obscure and rare words</p>
                  </div>
                  <Switch
                    id="patternCommonOnly"
                    checked={patternCommonOnly}
                    onCheckedChange={setPatternCommonOnly}
                  />
                </div>

                {patternError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{patternError}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handlePatternSearch}
                  disabled={patternSearching || (!patternStartsWith.trim() && !patternEndsWith.trim())}
                  className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-[1.01] shadow-lg hover:shadow-primary/25 active:scale-[0.99]"
                  size="lg"
                >
                  {patternSearching ? (
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

            {/* Pattern Results */}
            {patternResults.size > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">
                    Found {getPatternTotalWords()} word{getPatternTotalWords() !== 1 ? "s" : ""}
                  </h2>
                  <Badge variant="secondary" className="text-base px-4 py-2">
                    {patternResults.size} length{patternResults.size !== 1 ? "s" : ""}
                  </Badge>
                </div>

                <div className="grid gap-6">
                  {Array.from(patternResults.entries()).map(([length, words]) => {
                    const isExpanded = patternExpandedGroups.has(length)
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
                            <Button variant="outline" size="sm" onClick={() => togglePatternExpanded(length)} className="w-full py-4 transition-all duration-300 hover:bg-secondary">
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

            {patternResults.size === 0 && (patternStartsWith || patternEndsWith) && !patternSearching && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No words found</h3>
                  <p className="text-muted-foreground">Try different criteria</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

      </div>
    </div>
  )
}
