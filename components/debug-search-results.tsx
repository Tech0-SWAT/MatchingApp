// components/debug-search-results.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";

interface DebugSearchResultsProps {
  currentUser: any;
}

export function DebugSearchResults({ currentUser }: DebugSearchResultsProps) {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const safeJsonParse = async (response: Response) => {
    try {
      const text = await response.text();
      if (!text) return { empty: true };
      return JSON.parse(text);
    } catch (error) {
      return { parseError: true, text: await response.text().catch(() => "Could not read response") };
    }
  };

  const testAPIs = async () => {
    setLoading(true);
    setErrors([]);
    const results: any = {};

    // Test basic health
    try {
      const healthResponse = await fetch("/api/health");
      const responseText = await healthResponse.text();
      results.health = {
        status: healthResponse.status,
        ok: healthResponse.ok,
        text: responseText,
        contentType: healthResponse.headers.get("content-type"),
      };
    } catch (error: any) {
      results.health = { error: error.message };
      setErrors((prev) => [...prev, `Health API: ${error.message}`]);
    }

    // Test master-data API
    try {
      const masterResponse = await fetch("/api/master-data");
      const data = await safeJsonParse(masterResponse);
      results.masterData = {
        status: masterResponse.status,
        ok: masterResponse.ok,
        data,
        contentType: masterResponse.headers.get("content-type"),
      };
    } catch (error: any) {
      results.masterData = { error: error.message };
      setErrors((prev) => [...prev, `Master Data API: ${error.message}`]);
    }

    // Test matching API with minimal request
    try {
      const matchingResponse = await fetch("/api/matching/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "test",
          userId: currentUser?.id || 1,
        }),
      });
      const data = await safeJsonParse(matchingResponse);
      results.matching = {
        status: matchingResponse.status,
        ok: matchingResponse.ok,
        data,
        contentType: matchingResponse.headers.get("content-type"),
      };
    } catch (error: any) {
      results.matching = { error: error.message };
      setErrors((prev) => [...prev, `Matching API: ${error.message}`]);
    }

    // Test profile API
    try {
      const profileResponse = await fetch("/api/profile");
      const data = await safeJsonParse(profileResponse);
      results.profile = {
        status: profileResponse.status,
        ok: profileResponse.ok,
        data,
        contentType: profileResponse.headers.get("content-type"),
      };
    } catch (error: any) {
      results.profile = { error: error.message };
      setErrors((prev) => [...prev, `Profile API: ${error.message}`]);
    }

    // Test users API
    try {
      const usersResponse = await fetch("/api/users");
      const data = await safeJsonParse(usersResponse);
      results.users = {
        status: usersResponse.status,
        ok: usersResponse.ok,
        data,
        contentType: usersResponse.headers.get("content-type"),
      };
    } catch (error: any) {
      results.users = { error: error.message };
      setErrors((prev) => [...prev, `Users API: ${error.message}`]);
    }

    setDebugInfo(results);
    setLoading(false);
  };

  useEffect(() => {
    testAPIs();
  }, [currentUser?.id]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">API Debug Information</h2>
        <Button onClick={testAPIs} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh Tests
        </Button>
      </div>

      {loading && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Testing APIs...</AlertDescription>
        </Alert>
      )}

      {errors.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="font-semibold mb-1">Errors detected:</div>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-sm">
                  {error}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Current User Info</h3>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">{JSON.stringify(currentUser, null, 2)}</pre>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Environment Info</h3>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(
                {
                  nodeEnv: process.env.NODE_ENV,
                  userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "server",
                  href: typeof window !== "undefined" ? window.location.href : "server",
                  timestamp: new Date().toISOString(),
                },
                null,
                2
              )}
            </pre>
          </CardContent>
        </Card>

        {Object.entries(debugInfo).map(([apiName, result]: [string, any]) => (
          <Card key={apiName}>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">
                {apiName} API
                {result?.ok ? <span className="ml-2 text-green-600">✓ OK</span> : <span className="ml-2 text-red-600">✗ {result?.status || "ERROR"}</span>}
              </h3>
              <div className="space-y-2">
                {result?.contentType && <div className="text-xs text-gray-600">Content-Type: {result.contentType}</div>}
                <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto max-h-40">{JSON.stringify(result, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">Troubleshooting Tips</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• Check your browser's developer tools console (F12 → Console) for additional error messages</p>
            <p>• Verify that all API endpoints exist in your /api directory</p>
            <p>• Check if your database connection is working properly</p>
            <p>• Ensure environment variables are properly configured</p>
            <p>• Look for CORS issues if calling from different domain</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
